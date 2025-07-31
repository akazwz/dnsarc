package handlers

import (
	"context"
	"errors"
	"time"

	"connectrpc.com/connect"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	authv1 "dnsarc/gen/auth/v1"
	"dnsarc/internal/interceptors"
	"dnsarc/internal/models"
	"dnsarc/internal/services"
)

type AuthHandler struct {
	db         *gorm.DB
	jwtService *services.JwtService
}

func NewAuthHandler(db *gorm.DB, jwtService *services.JwtService) *AuthHandler {
	return &AuthHandler{db: db, jwtService: jwtService}
}

func (h *AuthHandler) Register(ctx context.Context, req *connect.Request[authv1.RegisterRequest]) (*connect.Response[authv1.RegisterResponse], error) {
	// 检查用户是否存在
	var user models.User
	if err := h.db.Where("email = ?", req.Msg.Email).First(&user).Error; err == nil {
		return nil, connect.NewError(connect.CodeAlreadyExists, errors.New("user already exists"))
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Msg.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	// 创建用户
	user = models.User{
		Email:    req.Msg.Email,
		Password: string(hashedPassword),
	}
	if err := h.db.Create(&user).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	token, err := h.jwtService.GenerateToken(user.ID, 24*time.Hour)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&authv1.RegisterResponse{
		AccessToken: token,
		User: &authv1.User{
			Id:        user.ID,
			Email:     user.Email,
			Avatar:    user.Avatar,
			CreatedAt: user.CreatedAt.Format(time.RFC3339),
			UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
		},
	}), nil
}

func (h *AuthHandler) Login(ctx context.Context, req *connect.Request[authv1.LoginRequest]) (*connect.Response[authv1.LoginResponse], error) {
	var user models.User
	if err := h.db.Where("email = ?", req.Msg.Email).First(&user).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, errors.New("user not found"))
	}
	// 验证密码
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Msg.Password)); err != nil {
		return nil, connect.NewError(connect.CodeUnauthenticated, errors.New("invalid password"))
	}
	// 生成token
	token, err := h.jwtService.GenerateToken(user.ID, 24*time.Hour)
	if err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return connect.NewResponse(&authv1.LoginResponse{
		AccessToken: token,
		User: &authv1.User{
			Id:        user.ID,
			Email:     user.Email,
			Avatar:    user.Avatar,
			CreatedAt: user.CreatedAt.Format(time.RFC3339),
			UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
		},
	}), nil
}

func (h *AuthHandler) WhoAmI(ctx context.Context, req *connect.Request[authv1.WhoAmIRequest]) (*connect.Response[authv1.WhoAmIResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	var user models.User
	if err := h.db.Where("id = ?", userID).First(&user).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, errors.New("user not found"))
	}
	return connect.NewResponse(&authv1.WhoAmIResponse{
		User: &authv1.User{
			Id:        user.ID,
			Email:     user.Email,
			Avatar:    user.Avatar,
			CreatedAt: user.CreatedAt.Format(time.RFC3339),
			UpdatedAt: user.UpdatedAt.Format(time.RFC3339),
		},
	}), nil
}
