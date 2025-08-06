package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net"
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
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"gorm.io/gorm"

	"dnsarc/gen/auth/v1/authv1connect"
	"dnsarc/gen/dns_record/v1/dns_recordv1connect"
	"dnsarc/gen/zone/v1/zonev1connect"
	"dnsarc/internal/database"
	"dnsarc/internal/event"
	"dnsarc/internal/handlers"
	"dnsarc/internal/interceptors"
	"dnsarc/internal/models"
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

	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string
	FrontendURL        string

	NS1 string
	NS2 string
}

func NewServer() *Server {
	config := &Config{
		DatabaseURL: os.Getenv("DATABASE_URL"),
		RedisURL:    os.Getenv("REDIS_URL"),
		JwtSecret:   os.Getenv("JWT_SECRET"),
		Port:        "8080",
		DNSCacheURL: os.Getenv("DNS_CACHE_URL"), // 从环境变量读取

		GoogleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:  os.Getenv("GOOGLE_REDIRECT_URL"),
		FrontendURL:        os.Getenv("FRONTEND_URL"),

		NS1: os.Getenv("NS1"),
		NS2: os.Getenv("NS2"),
	}

	slog.Info("config", "config", config)

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

func (s *Server) googleOauthConf() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     s.config.GoogleClientID,
		ClientSecret: s.config.GoogleClientSecret,
		RedirectURL:  s.config.GoogleRedirectURL,
		Scopes: []string{
			"https://www.googleapis.com/auth/userinfo.email",
		},
		Endpoint: google.Endpoint,
	}
}

func (s *Server) jwtService() *services.JwtService {
	return services.NewJwtService(s.config.JwtSecret)
}

func (s *Server) Start() error {
	go s.startZoneChecker()
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
	// google oatuh auth/google/callback
	r.Get("/auth/google/callback", func(w http.ResponseWriter, r *http.Request) {
		slog.Info("google oauth callback", "url", r.URL)
		tok, err := s.googleOauthConf().Exchange(context.Background(), r.URL.Query().Get("code"))
		if err != nil {
			slog.Error("failed to exchange code", "error", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		client := s.googleOauthConf().Client(context.Background(), tok)
		resp, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
		if err != nil {
			slog.Error("failed to get user info", "error", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		defer func() {
			if err := resp.Body.Close(); err != nil {
				slog.Error("failed to close response body", "error", err)
			}
		}()
		body, err := io.ReadAll(resp.Body)
		if err != nil {
			slog.Error("failed to read user info", "error", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		type UserInfo struct {
			Sub           string `json:"sub"`
			Picture       string `json:"picture"`
			Email         string `json:"email"`
			EmailVerified bool   `json:"email_verified"`
		}
		var data UserInfo
		if err := json.Unmarshal(body, &data); err != nil {
			slog.Error("failed to unmarshal user info", "error", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !data.EmailVerified {
			slog.Error("email not verified", "email", data.Email)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		// 检查 email 是否存在
		var user models.User
		if err := s.db.Where("email = ?", data.Email).First(&user).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				// 用户不存在，创建新用户
				user = models.User{
					Email:     data.Email,
					Avatar:    data.Picture,
					CreatedAt: time.Now(),
					UpdatedAt: time.Now(),
				}
				if err := s.db.Create(&user).Error; err != nil {
					slog.Error("failed to create user", "error", err)
					w.WriteHeader(http.StatusInternalServerError)
					return
				}
			} else {
				slog.Error("failed to get user", "error", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}
		}
		// 生成 token
		jwtService := s.jwtService()
		token, err := jwtService.GenerateToken(user.ID, time.Hour*24)
		if err != nil {
			slog.Error("failed to generate token", "error", err)
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
		redirectUrl := fmt.Sprintf("%s/auth?token=%s", s.config.FrontendURL, token)
		w.Header().Set("Location", redirectUrl)
		w.WriteHeader(http.StatusSeeOther)
	})
	authInterceptor := interceptors.NewAuthInterceptor(s.jwtService())
	authHandler := handlers.NewAuthHandler(s.db, s.jwtService(), s.googleOauthConf())
	r.Mount(authv1connect.NewAuthServiceHandler(authHandler, connect.WithInterceptors(authInterceptor)))
	zoneHandler := handlers.NewZoneHandler(s.db, s.rdb)
	r.Mount(zonev1connect.NewZoneServiceHandler(zoneHandler, connect.WithInterceptors(authInterceptor)))
	dnsRecordHandler := handlers.NewDNSRecordHandler(s.db, s.rdb)
	r.Mount(dns_recordv1connect.NewDNSRecordServiceHandler(dnsRecordHandler, connect.WithInterceptors(authInterceptor)))
}

func (s *Server) startZoneChecker() {
	slog.Info("starting periodic zone checker")

	check := func() {
		slog.Info("running check for inactive zones")
		var inActiveZones []models.Zone
		if err := s.db.Where("is_active = ?", false).Find(&inActiveZones).Error; err != nil {
			slog.Error("failed to get inactive zones", "error", err)
			return
		}
		for _, zone := range inActiveZones {
			go s.checkAndUpdateZone(zone)
		}
	}

	check()

	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		check()
	}
}

func (s *Server) checkAndUpdateZone(zone models.Zone) {
	ns, err := net.LookupNS(zone.ZoneName)
	if err != nil {
		slog.Warn("failed to lookup ns", "zone", zone.ZoneName, "error", err)
		return
	}
	if len(ns) > 0 {
		valid := false
		for _, n := range ns {
			if n.Host == s.config.NS1 || n.Host == s.config.NS2 {
				valid = true
				break
			}
		}
		if valid {
			slog.Info("zone ns found, activating", "zone", zone.ZoneName, "ns", ns)
			if err := s.db.Model(&zone).Update("is_active", true).Error; err != nil {
				slog.Error("failed to update zone status", "zone", zone.ZoneName, "error", err)
			}
			// active 的时候才发布事件
			go func() {
				event.PublishEvent(s.rdb, event.Event{
					Type:     event.EventTypeZoneCreate,
					ZoneName: zone.ZoneName,
				})
			}()
		}
	}
}
