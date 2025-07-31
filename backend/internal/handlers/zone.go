package handlers

import (
	"context"
	"strings"

	"connectrpc.com/connect"
	"github.com/samber/lo"
	"gorm.io/gorm"

	zonev1 "dnsarc/gen/zone/v1"
	"dnsarc/internal/interceptors"
	"dnsarc/internal/models"
)

type ZoneHandler struct {
	db *gorm.DB
}

func NewZoneHandler(db *gorm.DB) *ZoneHandler {
	return &ZoneHandler{db: db}
}

func (h *ZoneHandler) CreateZone(ctx context.Context, req *connect.Request[zonev1.CreateZoneRequest]) (*connect.Response[zonev1.CreateZoneResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	domain := strings.ToLower(req.Msg.Domain)
	zone := models.Zone{
		UserID: userID,
		Domain: domain,
	}
	if err := h.db.Create(&zone).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return &connect.Response[zonev1.CreateZoneResponse]{
		Msg: &zonev1.CreateZoneResponse{
			Zone: zone.ToProto(),
		},
	}, nil
}

func (h *ZoneHandler) ListZones(ctx context.Context, req *connect.Request[zonev1.ListZonesRequest]) (*connect.Response[zonev1.ListZonesResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	var zones []models.Zone
	if err := h.db.Where("user_id = ?", userID).Find(&zones).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return &connect.Response[zonev1.ListZonesResponse]{
		Msg: &zonev1.ListZonesResponse{
			Zones: lo.Map(zones, func(zone models.Zone, _ int) *zonev1.Zone {
				return zone.ToProto()
			}),
		},
	}, nil
}

func (h *ZoneHandler) GetZone(ctx context.Context, req *connect.Request[zonev1.GetZoneRequest]) (*connect.Response[zonev1.GetZoneResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	var zone models.Zone
	if err := h.db.Where("user_id = ? AND id = ?", userID, req.Msg.Id).First(&zone).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}
	return &connect.Response[zonev1.GetZoneResponse]{
		Msg: &zonev1.GetZoneResponse{
			Zone: zone.ToProto(),
		},
	}, nil
}

func (h *ZoneHandler) DeleteZone(ctx context.Context, req *connect.Request[zonev1.DeleteZoneRequest]) (*connect.Response[zonev1.DeleteZoneResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	if err := h.db.Where("user_id = ? AND id = ?", userID, req.Msg.Id).Delete(&models.Zone{}).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}
	return &connect.Response[zonev1.DeleteZoneResponse]{}, nil
}
