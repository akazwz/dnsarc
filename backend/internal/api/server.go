package api

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"connectrpc.com/connect"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/redis/go-redis/v9"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"
	"gorm.io/gorm"

	"dnsarc/gen/auth/v1/authv1connect"
	"dnsarc/gen/dns_record/v1/dns_recordv1connect"
	"dnsarc/gen/zone/v1/zonev1connect"
	"dnsarc/internal/database"
	"dnsarc/internal/handlers"
	"dnsarc/internal/interceptors"
	"dnsarc/internal/services"
)

type Server struct {
	db     *gorm.DB
	rdb    *redis.Client
	config *Config
}

type Config struct {
	DatabaseURL string
	RedisURL    string
	JwtSecret   string
	Port        string
	DNSCacheURL string
}

func NewServer() *Server {
	config := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		RedisURL:    os.Getenv("REDIS_URL"),
		JwtSecret:   os.Getenv("JWT_SECRET"),
		Port:        "8080",
		DNSCacheURL: os.Getenv("DNS_CACHE_URL"), // 从环境变量读取
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

	return &Server{
		db:     db,
		rdb:    rdb,
		config: config,
	}
}

func (s *Server) Start() error {
	r := chi.NewRouter()

	// 添加 CORS 中间件
	r.Use(cors.AllowAll().Handler)

	// 添加基本路由
	s.setupRoutes(r)

	// 创建 HTTP/2 服务器
	server := &http.Server{
		Addr:    ":" + s.config.Port,
		Handler: h2c.NewHandler(r, &http2.Server{}),
	}

	// 创建一个通道来接收错误
	errChan := make(chan error, 1)

	// 在 goroutine 中启动服务器
	go func() {
		slog.Info("starting HTTP/2 server", "port", s.config.Port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			errChan <- err
		}
	}()

	// 等待中断信号
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	// 阻塞等待信号或错误
	select {
	case err := <-errChan:
		return err
	case <-quit:
		slog.Info("shutting down server...")

		// 创建超时上下文
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		// 优雅关闭服务器
		if err := server.Shutdown(ctx); err != nil {
			slog.Error("server forced to shutdown", "error", err)
			return err
		}

		slog.Info("server exited")
		return nil
	}
}

func (s *Server) setupRoutes(r chi.Router) {
	// 健康检查端点
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		if _, err := w.Write([]byte("OK")); err != nil {
			slog.Error("failed to write health response", "error", err)
		}
	})
	jwtService := services.NewJwtService(s.config.JwtSecret)
	authInterceptor := interceptors.NewAuthInterceptor(jwtService)
	authHandler := handlers.NewAuthHandler(s.db, jwtService)
	r.Mount(authv1connect.NewAuthServiceHandler(authHandler, connect.WithInterceptors(authInterceptor)))
	zoneHandler := handlers.NewZoneHandler(s.db, s.rdb)
	r.Mount(zonev1connect.NewZoneServiceHandler(zoneHandler, connect.WithInterceptors(authInterceptor)))
	dnsRecordHandler := handlers.NewDNSRecordHandler(s.db, s.rdb)
	r.Mount(dns_recordv1connect.NewDNSRecordServiceHandler(dnsRecordHandler, connect.WithInterceptors(authInterceptor)))
}
