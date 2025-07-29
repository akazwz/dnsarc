package api

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
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
	JwtSecret   string
	Port        string
}

func NewServer() *Server {
	// 从环境变量或配置加载
	config := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		JwtSecret:   os.Getenv("JWT_SECRET"),
		Port:        "8080",
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
	r := chi.NewRouter()

	// 添加 CORS 中间件
	r.Use(cors.AllowAll().Handler)

	// 添加基本路由
	s.setupRoutes(r)

	server := &http.Server{
		Addr:    ":" + s.config.Port,
		Handler: r,
	}

	// 创建一个通道来接收错误
	errChan := make(chan error, 1)

	// 在 goroutine 中启动服务器
	go func() {
		slog.Info("starting HTTP server", "port", s.config.Port)
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

	// API 路由组
	r.Route("/api", func(r chi.Router) {
		// 这里可以添加更多的 API 路由
		r.Get("/", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			if _, err := w.Write([]byte("DNS Arc API")); err != nil {
				slog.Error("failed to write API response", "error", err)
			}
		})
		r.Post("/dns_records", func(w http.ResponseWriter, r *http.Request) {
			var dnsRecord models.DNSRecord
			if err := json.NewDecoder(r.Body).Decode(&dnsRecord); err != nil {
				slog.Error("failed to decode DNS record", "error", err)
				http.Error(w, err.Error(), http.StatusBadRequest)
				return
			}
		})
	})
}
