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
	"syscall"
	"time"

	"github.com/bits-and-blooms/bloom/v3"
	"github.com/miekg/dns"
	"github.com/redis/go-redis/v9"
	"github.com/weppos/publicsuffix-go/publicsuffix"
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
	cache, err := NewDNSCache(db, 100000, time.Minute*30)
	if err != nil {
		slog.Error("failed to create DNS cache", "error", err)
		os.Exit(1)
	}
	bloomFilter := bloom.NewWithEstimates(1000000, 0.01)
	go func() {
		domains := make([]string, 0)
		if err := db.Model(&models.Zone{}).Select("domain").Where("is_active = ?", true).Find(&domains).Error; err != nil {
			slog.Error("failed to get domains for bloom filter", "error", err)
			return
		}
		for _, domain := range domains {
			bloomFilter.AddString(domain)
		}
		slog.Info("bloom filter initialized", "domains", len(domains))
	}()
	return &Server{
		db:          db,
		rdb:         rdb,
		config:      config,
		cache:       cache,
		bloomFilter: bloomFilter,
	}
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
		domain := r.Question[0].Name
		domain = strings.TrimSuffix(domain, ".")
		domain = strings.ToLower(domain)

		// 提取Zone（获取顶级域名）
		zone, err := publicsuffix.Domain(domain)
		if err != nil {
			slog.Error("failed to get zone", "error", err, "domain", domain)
			m.Rcode = dns.RcodeNameError
			if err := w.WriteMsg(m); err != nil {
				slog.Error("failed to write response", "error", err)
			}
		}

		// 使用bloom filter检查Zone是否存在
		if !s.bloomFilter.TestString(zone) {
			slog.Info("zone not found in bloom filter", "zone", zone)
			m.Rcode = dns.RcodeNameError
			if err := w.WriteMsg(m); err != nil {
				slog.Error("failed to write response", "error", err)
			}
			return
		}
		// 获取 record
		records := make([]models.DNSRecord, 0)

		recordsA := make([]models.DNSRecord, 0)
		start := time.Now()
		if needQuery {
			if cachedRecords, err := s.cache.GetRecords(context.Background(), domain); err != nil {
				slog.Error("failed to get records", "error", err)
			} else {
				records = cachedRecords
			}
		}
		slog.Info("get records", "time", time.Since(start))
		for _, record := range records {
			if record.Type == "A" {
				recordsA = append(recordsA, record)
			}
		}
		for _, q := range r.Question {
			switch q.Qtype {
			case dns.TypeSOA:
				s.handleSOA(m, q)
			case dns.TypeNS:
				s.handleNS(m, q)
			case dns.TypeA:
				s.handleA(m, q, recordsA)
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
	record := records[rand.Intn(len(records))]
	rr := &dns.A{
		Hdr: dns.RR_Header{
			Name:   q.Name,
			Rrtype: dns.TypeA,
			Class:  dns.ClassINET,
			Ttl:    uint32(record.TTL),
		},
		A: net.ParseIP(record.Value).To4(),
	}
	m.Answer = append(m.Answer, rr)
}

func (s *Server) startSubscribeRedis() {
	slog.Info("start subscribe redis", "event_channel", "event")
	ctx := context.Background()
	sub := s.rdb.Subscribe(ctx, "event")
	defer sub.Close()
	ch := sub.Channel()
	for msg := range ch {
		var event event.Event
		if err := json.Unmarshal([]byte(msg.Payload), &event); err != nil {
			slog.Error("failed to unmarshal event", "error", err)
			continue
		}
		slog.Info("received message", "message", event)
	}
}
