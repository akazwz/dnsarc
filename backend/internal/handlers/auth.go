package handlers

import (
	"context"
	"errors"
	"time"

	"connectrpc.com/connect"
	"golang.org/x/oauth2"
	"gorm.io/gorm"

	authv1 "dnsarc/gen/auth/v1"
	"dnsarc/internal/interceptors"
	"dnsarc/internal/models"
	"dnsarc/internal/services"
)

type AuthHandler struct {
	db              *gorm.DB
	jwtService      *services.JwtService
	googleOauthConf *oauth2.Config
}

func NewAuthHandler(db *gorm.DB, jwtService *services.JwtService, googleOauthConf *oauth2.Config) *AuthHandler {
	return &AuthHandler{db: db, jwtService: jwtService, googleOauthConf: googleOauthConf}
}

func (h *AuthHandler) GoogleLoginURL(ctx context.Context, req *connect.Request[authv1.GoogleLoginURLRequest]) (*connect.Response[authv1.GoogleLoginURLResponse], error) {
	return connect.NewResponse(&authv1.GoogleLoginURLResponse{
		Url: h.googleOauthConf.AuthCodeURL("state"),
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
