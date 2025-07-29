package dns

import (
	"log/slog"
	"math/rand"
	"net"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/miekg/dns"
	"gorm.io/gorm"

	"dnsarc/internal/database"
	"dnsarc/internal/models"
)

type Server struct {
	db     *gorm.DB
	config *Config
}

type Config struct {
	DatabaseURL string
	NS1         string
	NS2         string
	MBox        string
	Port        string
	Host        string
}

func NewServer() *Server {
	// 从环境变量或配置加载
	config := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
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

	return &Server{
		db:     db,
		config: config,
	}
}

func (s *Server) Start() error {
	mux := dns.NewServeMux()
	mux.HandleFunc(".", func(w dns.ResponseWriter, r *dns.Msg) {
		m := new(dns.Msg)
		m.SetReply(r)
		m.Authoritative = true

		needQueryDB := func() bool {
			for _, q := range r.Question {
				if q.Qtype == dns.TypeA {
					return true
				}
			}
			return false
		}()

		// 获取 domain
		domain := r.Question[0].Name
		// 获取 record
		records := make([]models.DNSRecord, 0)
		if needQueryDB {
			if err := s.db.Where("domain = ?", domain).Find(&records).Error; err != nil {
				slog.Error("failed to get records", "error", err)
			}
		}
		for _, q := range r.Question {
			switch q.Qtype {
			case dns.TypeSOA:
				s.handleSOA(m, q)
			case dns.TypeNS:
				s.handleNS(m, q)
			case dns.TypeA:
				s.handleA(m, q, records)
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

	// 错误通道
	errChan := make(chan error, 2)

	// 启动 UDP 服务器
	go func() {
		if err := udpServer.ListenAndServe(); err != nil {
			errChan <- err
		}
	}()

	// 启动 TCP 服务器
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
	validRecords := make([]models.DNSRecord, 0)
	for _, record := range records {
		if record.Type == "A" {
			validRecords = append(validRecords, record)
		}
	}
	if len(validRecords) == 0 {
		m.Rcode = dns.RcodeNameError
		return
	}
	// 随机选择一个 record
	record := validRecords[rand.Intn(len(validRecords))]
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
