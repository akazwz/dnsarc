package dns

import (
	"context"
	"encoding/json"
	"log/slog"
	"math/rand"
	"net"
	"os"
	"os/signal"
	"strings"
	"sync"
	"syscall"
	"time"
	"unicode/utf8"

	"github.com/bits-and-blooms/bloom/v3"
	"github.com/miekg/dns"
	"github.com/openai/openai-go"
	"github.com/openai/openai-go/responses"
	"github.com/redis/go-redis/v9"
	"github.com/samber/lo"
	"github.com/weppos/publicsuffix-go/publicsuffix"
	"golang.org/x/net/idna"
	"gorm.io/gorm"

	"dnsarc/internal/database"
	"dnsarc/internal/event"
	"dnsarc/internal/models"
)

type Server struct {
	db          *gorm.DB
	rdb         *redis.Client
	config      *Config
	cache       *DNSCache
	bloomFilter *bloom.BloomFilter
	bloomMu     sync.Mutex // 只保护 bloomFilter 指针赋值

	pendingRebuilds int
	rebuildTimer    *time.Timer

	openaiClient openai.Client
}

type Config struct {
	DatabaseURL string
	RedisURL    string
	NS1         string
	NS2         string
	MBox        string
	Port        string
	Host        string
}

var BLACK_LIST_ZONE = []string{
	"version.bind",
}

func NewServer() *Server {
	config := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		RedisURL:    os.Getenv("REDIS_URL"),
		NS1:         os.Getenv("NS1"),
		NS2:         os.Getenv("NS2"),
		MBox:        os.Getenv("MBOX"),
		Port:        "53",
		Host:        "0.0.0.0",
	}
	db, err := database.NewDatabase(config.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	rdb, err := database.NewRedis(config.RedisURL)
	if err != nil {
		slog.Error("failed to connect to redis", "error", err)
		os.Exit(1)
	}
	cache, err := NewDNSCache(db, 1000000, time.Minute*30)
	if err != nil {
		slog.Error("failed to create DNS cache", "error", err)
		os.Exit(1)
	}
	bloomFilter := bloom.NewWithEstimates(1000000, 0.01)
	go func() {
		// 初始化bloom filter
		zoneNames := make([]string, 0)
		if err := db.Model(&models.Zone{}).Select("zone_name").Where("is_active = ?", true).Find(&zoneNames).Error; err != nil {
			slog.Error("failed to get zone names for bloom filter", "error", err)
			return
		}
		for _, zoneName := range zoneNames {
			bloomFilter.AddString(zoneName)
		}
		slog.Info("bloom filter initialized", "zone_names", zoneNames)
	}()
	openaiClient := openai.NewClient()
	return &Server{
		db:           db,
		rdb:          rdb,
		config:       config,
		cache:        cache,
		bloomFilter:  bloomFilter,
		bloomMu:      sync.Mutex{},
		openaiClient: openaiClient,
	}
}

func (s *Server) rebuildBloomFilter() {
	slog.Info("rebuilding bloom filter")
	bloomFilter := bloom.NewWithEstimates(1000000, 0.01)
	zoneNames := make([]string, 0)
	if err := s.db.Model(&models.Zone{}).Select("zone_name").Where("is_active = ?", true).Find(&zoneNames).Error; err != nil {
		slog.Error("failed to get zone names for bloom filter", "error", err)
		return
	}
	for _, zoneName := range zoneNames {
		bloomFilter.AddString(zoneName)
	}

	// 只保护指针赋值操作
	s.bloomMu.Lock()
	s.bloomFilter = bloomFilter
	s.bloomMu.Unlock()

	slog.Info("bloom filter rebuilt", "zone_names", len(zoneNames))
}

func (s *Server) Start() error {
	go s.startSubscribeRedis()

	mux := dns.NewServeMux()
	mux.HandleFunc(".", func(w dns.ResponseWriter, r *dns.Msg) {
		m := new(dns.Msg)
		m.SetReply(r)
		m.Authoritative = true

		needQuery := func() bool {
			for _, q := range r.Question {
				if q.Qtype == dns.TypeA {
					return true
				}
			}
			return false
		}()

		// 获取 domain
		firstQuestion := r.Question[0]
		name := firstQuestion.Name
		name = strings.TrimSuffix(name, ".")
		name = strings.ToLower(name)
		name, err := idna.ToASCII(name)
		if err != nil {
			slog.Error("failed to convert name to ASCII", "error", err, "name", name)
			m.Rcode = dns.RcodeServerFailure
			if err := w.WriteMsg(m); err != nil {
				slog.Error("failed to write response", "error", err)
			}
		}
		slog.Info("name", "name", name)
		// 提取 zone（获取顶级域名）
		zoneName, err := publicsuffix.Domain(name)
		slog.Info("zoneName", "zoneName", zoneName)
		zoneName = strings.TrimSuffix(zoneName, ".")
		if lo.Contains(BLACK_LIST_ZONE, zoneName) {
			m.Rcode = dns.RcodeNameError
			if err := w.WriteMsg(m); err != nil {
				slog.Error("failed to write response", "error", err)
			}
			return
		}
		if err != nil {
			if firstQuestion.Qtype == dns.TypeTXT {
				prompt, err := idna.ToUnicode(firstQuestion.Name)
				if err != nil {
					slog.Error("failed to convert name to Unicode", "error", err, "name", firstQuestion.Name)
					m.Rcode = dns.RcodeServerFailure
					if err := w.WriteMsg(m); err != nil {
						slog.Error("failed to write response", "error", err)
					}
					return
				}
				slog.Info("prompt", "prompt", prompt)
				response, err := s.openaiClient.Responses.New(context.Background(), responses.ResponseNewParams{
					Model:        "gpt-4.1-mini",
					Instructions: openai.String("You are a helpful assistant that can answer questions, and only output plain text. only output English text."),
					Input: responses.ResponseNewParamsInputUnion{
						OfString: openai.String(prompt),
					},
					MaxOutputTokens: openai.Int(1000),
				})
				if err != nil {
					slog.Error("failed to create response", "error", err)
					m.Rcode = dns.RcodeServerFailure
					if err := w.WriteMsg(m); err != nil {
						slog.Error("failed to write response", "error", err)
					}
				}
				responseText := response.OutputText()
				slog.Info("response", "response", responseText)

				txtStrings := splitTXTRecord(responseText)
				rr := &dns.TXT{
					Hdr: dns.RR_Header{
						Name:   firstQuestion.Name,
						Rrtype: dns.TypeTXT,
						Class:  dns.ClassINET,
						Ttl:    3600,
					},
					Txt: txtStrings,
				}
				m.Answer = append(m.Answer, rr)
				if err := w.WriteMsg(m); err != nil {
					slog.Error("failed to write response", "error", err)
				}
				return
			}
			slog.Error("failed to get zone", "error", err, "name", firstQuestion.Name)
			m.Rcode = dns.RcodeNameError
			if err := w.WriteMsg(m); err != nil {
				slog.Error("failed to write response", "error", err)
			}
		}

		// 使用bloom filter检查Zone是否存在
		if !s.bloomFilter.TestString(zoneName) {
			slog.Info("zone not found in bloom filter", "zone", zoneName)
			m.Rcode = dns.RcodeNameError
			if err := w.WriteMsg(m); err != nil {
				slog.Error("failed to write response", "error", err)
			}
			return
		}
		// 获取 record
		records := make([]models.DNSRecord, 0)
		start := time.Now()
		if needQuery {
			if cachedRecords, err := s.cache.GetRecords(context.Background(), zoneName); err != nil {
				slog.Error("failed to get records", "error", err)
			} else {
				records = cachedRecords
			}
		}
		slog.Info("get records", "time", time.Since(start))
		for _, q := range r.Question {
			switch q.Qtype {
			case dns.TypeSOA:
				s.handleSOA(m, q)
			case dns.TypeNS:
				s.handleNS(m, q)
			case dns.TypeCAA:
				s.handleCAA(m, q)
			case dns.TypeA:
				s.handleA(m, q, records)
			case dns.TypeCNAME:
				s.handleCNAME(m, q, records)
			default:
				m.Rcode = dns.RcodeNotImplemented
			}
		}
		if err := w.WriteMsg(m); err != nil {
			slog.Error("failed to write response", "error", err)
		}
	})

	udpServer := &dns.Server{
		Addr:    ":53",
		Net:     "udp",
		Handler: mux,
	}
	tcpServer := &dns.Server{
		Addr:    ":53",
		Net:     "tcp",
		Handler: mux,
	}

	errChan := make(chan error, 2)
	go func() {
		if err := udpServer.ListenAndServe(); err != nil {
			errChan <- err
		}
	}()
	go func() {
		if err := tcpServer.ListenAndServe(); err != nil {
			errChan <- err
		}
	}()
	slog.Info("dnsarc started")
	// 信号处理
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	// 等待信号或错误
	select {
	case err := <-errChan:
		return err
	case sig := <-sigChan:
		slog.Info("received signal, shutting down", "signal", sig)
		if err := udpServer.Shutdown(); err != nil {
			slog.Error("failed to shutdown UDP server", "error", err)
		}
		if err := tcpServer.Shutdown(); err != nil {
			slog.Error("failed to shutdown TCP server", "error", err)
		}
		return nil
	}
}

func (s *Server) handleSOA(m *dns.Msg, q dns.Question) {
	now := time.Now()
	serial := uint32(now.Year())*10000 + uint32(now.Month())*100 + uint32(now.Day())
	rr := &dns.SOA{
		Hdr: dns.RR_Header{
			Name:   q.Name,
			Rrtype: dns.TypeSOA,
			Class:  dns.ClassINET,
			Ttl:    3600,
		},
		Ns:      s.config.NS1,
		Mbox:    s.config.MBox,
		Serial:  serial,
		Refresh: 1800,
		Retry:   600,
		Expire:  86400,
		Minttl:  60,
	}
	m.Answer = append(m.Answer, rr)
}

func (s *Server) handleNS(m *dns.Msg, q dns.Question) {
	nsRecords := []string{s.config.NS1, s.config.NS2}
	for _, ns := range nsRecords {
		rr := &dns.NS{
			Hdr: dns.RR_Header{
				Name:   q.Name,
				Rrtype: dns.TypeNS,
				Class:  dns.ClassINET,
				Ttl:    3600,
			},
			Ns: dns.Fqdn(ns),
		}
		m.Answer = append(m.Answer, rr)
	}
}

func (s *Server) handleA(m *dns.Msg, q dns.Question, records []models.DNSRecord) {
	if len(records) == 0 {
		m.Rcode = dns.RcodeNameError
		return
	}
	name := strings.TrimSuffix(q.Name, ".")
	name = strings.ToLower(name)
	aRecords := lo.Filter(records, func(record models.DNSRecord, _ int) bool {
		return record.Name == name && record.Type == "A"
	})
	cnameRecords := lo.Filter(records, func(record models.DNSRecord, _ int) bool {
		return record.Name == name && record.Type == "CNAME"
	})
	if len(aRecords) > 0 {
		record := s.selectRecordWithWeight(aRecords)
		rr := &dns.A{
			Hdr: dns.RR_Header{
				Name:   q.Name,
				Rrtype: dns.TypeA,
				Class:  dns.ClassINET,
				Ttl:    uint32(record.TTL),
			},
			A: net.ParseIP(record.Content).To4(),
		}
		m.Answer = append(m.Answer, rr)
	} else if len(cnameRecords) > 0 {
		record := s.selectRecordWithWeight(cnameRecords)
		s.flattenCNAME(m, q, record)
		return
	} else {
		m.Rcode = dns.RcodeNameError
		return
	}
}

func (s *Server) handleCNAME(m *dns.Msg, q dns.Question, records []models.DNSRecord) {
	name := strings.TrimSuffix(q.Name, ".")
	name = strings.ToLower(name)
	records = lo.Filter(records, func(record models.DNSRecord, _ int) bool {
		return record.Name == name && record.Type == "CNAME"
	})
	if len(records) == 0 {
		m.Rcode = dns.RcodeNameError
		return
	}
	record := s.selectRecordWithWeight(records)
	rr := &dns.CNAME{
		Hdr: dns.RR_Header{
			Name:   q.Name,
			Rrtype: dns.TypeCNAME,
			Class:  dns.ClassINET,
			Ttl:    uint32(record.TTL),
		},
		Target: record.Content,
	}
	m.Answer = append(m.Answer, rr)
}

func (s *Server) selectRecordWithWeight(records []models.DNSRecord) models.DNSRecord {
	weights := lo.Map(records, func(record models.DNSRecord, _ int) int {
		return record.Weight
	})
	totalWeight := lo.Sum(weights)
	if totalWeight == 0 {
		return records[rand.Intn(len(records))]
	}
	randomWeight := rand.Intn(totalWeight)
	accumulatedWeight := 0
	var record models.DNSRecord
	for _, item := range records {
		accumulatedWeight += item.Weight
		if accumulatedWeight >= randomWeight {
			record = item
			break
		}
	}
	return record
}

func (s *Server) flattenCNAME(m *dns.Msg, q dns.Question, record models.DNSRecord) {
	targetDomain := record.Content
	client := dns.Client{
		Timeout: time.Second * 5,
	}
	msg := dns.Msg{}
	msg.SetQuestion(dns.Fqdn(targetDomain), dns.TypeA)
	resp, _, err := client.Exchange(&msg, "8.8.8.8:53")
	if err != nil {
		slog.Error("failed to resolve CNAME target", "error", err, "target", targetDomain)
		m.Rcode = dns.RcodeServerFailure //  设置错误码
		return
	}
	//  检查DNS响应码
	if resp.Rcode != dns.RcodeSuccess {
		slog.Warn("CNAME target resolution failed", "target", targetDomain, "rcode", resp.Rcode)
		m.Rcode = resp.Rcode // 传递上游错误码
		return
	}
	//  可以考虑处理CNAME链
	for _, answer := range resp.Answer {
		if aRecord, ok := answer.(*dns.A); ok {
			rr := &dns.A{
				Hdr: dns.RR_Header{
					Name:   q.Name,
					Rrtype: dns.TypeA,
					Class:  dns.ClassINET,
					Ttl:    uint32(record.TTL),
				},
				A: aRecord.A,
			}
			m.Answer = append(m.Answer, rr)
		}
	}
	if len(m.Answer) == 0 {
		m.Rcode = dns.RcodeNameError
	}
}

func (s *Server) handleCAA(m *dns.Msg, q dns.Question) {
	// handleCAA 处理CAA记录查询请求
	// CAA记录用于指定哪些证书颁发机构(CA)可以为该域名颁发证书
	// 遵循RFC 6844标准：https://tools.ietf.org/html/rfc6844
	// 当前配置：允许所有证书颁发机构颁发证书

	// 要允许所有CA颁发证书，我们不返回任何限制性的CAA记录
	// 根据RFC 6844，如果没有CAA记录或没有相关的issue记录，
	// 则允许任何CA为该域名颁发证书

	// 可选：只返回iodef记录用于违规报告，但不限制任何CA
	caas := []*dns.CAA{
		{
			Hdr: dns.RR_Header{
				Name:   q.Name,        // 查询的域名
				Rrtype: dns.TypeCAA,   // 记录类型：CAA
				Class:  dns.ClassINET, // 类别：Internet
				Ttl:    3600,          // TTL：1小时
			},
			Flag:  0,                                                                     // 标志位：0表示非关键
			Tag:   "iodef",                                                               // 标签：iodef表示事件报告
			Value: "mailto:security@" + strings.TrimSuffix(strings.ToLower(q.Name), "."), // 违规报告邮箱
		},
	}

	// 将所有CAA记录添加到DNS响应中
	for _, caa := range caas {
		m.Answer = append(m.Answer, caa)
	}
}

func (s *Server) startSubscribeRedis() {
	slog.Info("start subscribe redis", "event_channel", "event")
	ctx := context.Background()
	sub := s.rdb.Subscribe(ctx, "event")
	defer func() {
		if err := sub.Close(); err != nil {
			slog.Error("failed to close redis subscription", "error", err)
		}
	}()
	ch := sub.Channel()
	for msg := range ch {
		var evt event.Event
		if err := json.Unmarshal([]byte(msg.Payload), &evt); err != nil {
			slog.Error("failed to unmarshal event", "error", err)
			continue
		}
		switch evt.Type {
		case event.EventTypeDNSRecordCreate, event.EventTypeDNSRecordDelete, event.EventTypeDNSRecordUpdate:
			s.cache.InvalidateCache(evt.ZoneName)
		case event.EventTypeZoneCreate:
			slog.Info("zone create", "zone_name", evt.ZoneName)
			s.bloomFilter.AddString(evt.ZoneName)
		case event.EventTypeZoneDelete:
			s.cache.InvalidateCache(evt.ZoneName)
			s.pendingRebuilds++
			count := s.pendingRebuilds
			if count >= 10 {
				s.rebuildBloomFilter()
				s.pendingRebuilds = 0
			}
			if s.rebuildTimer != nil {
				s.rebuildTimer.Stop()
			}
			s.rebuildTimer = time.AfterFunc(time.Second*10, func() {
				s.rebuildBloomFilter()
				s.pendingRebuilds = 0
			})
		}
		slog.Info("received message", "message", evt)
	}
}

func splitTXTRecord(text string) []string {
	const maxLength = 255
	var result []string

	for len(text) > 0 {
		if len(text) <= maxLength {
			// 剩余文本不超过限制，直接添加
			result = append(result, text)
			break
		}

		// 找到最大的有效UTF-8边界
		cutPoint := maxLength
		for cutPoint > 0 && !utf8.ValidString(text[:cutPoint]) {
			cutPoint--
		}

		// 如果找不到有效边界，至少取一个字符
		if cutPoint == 0 {
			_, size := utf8.DecodeRuneInString(text)
			cutPoint = size
		}

		result = append(result, text[:cutPoint])
		text = text[cutPoint:]
	}

	return result
}
