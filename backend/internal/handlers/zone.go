package handlers

import (
	"context"
	"encoding/json"
	"log/slog"

	"connectrpc.com/connect"
	"github.com/redis/go-redis/v9"
	"github.com/samber/lo"
	"github.com/weppos/publicsuffix-go/publicsuffix"
	"gorm.io/gorm"

	zonev1 "dnsarc/gen/zone/v1"
	"dnsarc/internal/event"
	"dnsarc/internal/interceptors"
	"dnsarc/internal/models"
)

type ZoneHandler struct {
	db  *gorm.DB
	rdb *redis.Client
}

func NewZoneHandler(db *gorm.DB, rdb *redis.Client) *ZoneHandler {
	return &ZoneHandler{db: db, rdb: rdb}
}

func (h *ZoneHandler) PublishEvent(event event.Event) {
	ctx := context.Background()
	slog.Info("publish event", "event", event)
	json, err := json.Marshal(event)
	if err != nil {
		slog.Error("failed to marshal event", "error", err)
		return
	}
	if err := h.rdb.Publish(ctx, "event", string(json)).Err(); err != nil {
		slog.Error("failed to publish event", "error", err)
	}
}

func (h *ZoneHandler) CreateZone(ctx context.Context, req *connect.Request[zonev1.CreateZoneRequest]) (*connect.Response[zonev1.CreateZoneResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	zoneName, err := publicsuffix.Domain(req.Msg.ZoneName)
	if err != nil {
		return nil, connect.NewError(connect.CodeInvalidArgument, err)
	}
	zone := models.Zone{
		UserID:   userID,
		ZoneName: zoneName,
	}
	if err := h.db.Create(&zone).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	go func() {
		h.PublishEvent(event.Event{
			Type:     event.EventTypeZoneCreate,
			ZoneName: zoneName,
		})
	}()
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

func (h *ZoneHandler) GetZoneByName(ctx context.Context, req *connect.Request[zonev1.GetZoneByNameRequest]) (*connect.Response[zonev1.GetZoneByNameResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	var zone models.Zone
	if err := h.db.Where("user_id = ? AND zone_name = ?", userID, req.Msg.ZoneName).First(&zone).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}
	return &connect.Response[zonev1.GetZoneByNameResponse]{
		Msg: &zonev1.GetZoneByNameResponse{
			Zone: zone.ToProto(),
		},
	}, nil
}

func (h *ZoneHandler) DeleteZone(ctx context.Context, req *connect.Request[zonev1.DeleteZoneRequest]) (*connect.Response[zonev1.DeleteZoneResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	var zone models.Zone
	if err := h.db.Where("user_id = ? AND id = ?", userID, req.Msg.Id).First(&zone).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}
	if err := h.db.Delete(&zone).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	go func() {
		h.PublishEvent(event.Event{
			Type:     event.EventTypeZoneDelete,
			ZoneName: zone.ZoneName,
		})
	}()
	return &connect.Response[zonev1.DeleteZoneResponse]{}, nil
}
