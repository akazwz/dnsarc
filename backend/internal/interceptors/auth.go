package interceptors

import (
	"context"
	"dnsarc/gen/auth/v1/authv1connect"
	"dnsarc/internal/services"
	"errors"
	"slices"
	"strings"

	"connectrpc.com/connect"
)

// contextKey 定义自定义的context key类型
type contextKey string

const (
	// UserIDKey 用户ID的context key
	UserIDKey contextKey = "user_id"
)

var publicRoutes = []string{
	authv1connect.AuthServiceLoginProcedure,
	authv1connect.AuthServiceRegisterProcedure,
}

func NewAuthInterceptor(jwtService *services.JwtService) connect.UnaryInterceptorFunc {
	interceptor := func(next connect.UnaryFunc) connect.UnaryFunc {
		return func(
			ctx context.Context,
			req connect.AnyRequest,
		) (connect.AnyResponse, error) {
			if slices.Contains(publicRoutes, req.Spec().Procedure) {
				return next(ctx, req)
			}
			bearerToken := req.Header().Get("Authorization")
			if bearerToken == "" {
				return nil, connect.NewError(
					connect.CodeUnauthenticated,
					errors.New("no token provided"),
				)
			}
			token := strings.Split(bearerToken, " ")[1]
			if token == "" {
				return nil, connect.NewError(
					connect.CodeUnauthenticated,
					errors.New("invalid token"),
				)
			}
			userID, err := jwtService.VerifyToken(token)
			if err != nil {
				return nil, connect.NewError(
					connect.CodeUnauthenticated,
					errors.New("invalid token"),
				)
			}
			ctx = context.WithValue(ctx, UserIDKey, userID)
			return next(ctx, req)
		}
	}
	return interceptor
}

func GetUserID(ctx context.Context) (string, error) {
	userID, ok := ctx.Value(UserIDKey).(string)
	if !ok {
		return "", errors.New("user_id not found")
	}
	return userID, nil
}
