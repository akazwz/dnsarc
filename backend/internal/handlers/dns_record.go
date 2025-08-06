package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"strings"

	"connectrpc.com/connect"
	"github.com/redis/go-redis/v9"
	"github.com/samber/lo"
	"gorm.io/gorm"

	dns_recordv1 "dnsarc/gen/dns_record/v1"
	"dnsarc/internal/event"
	"dnsarc/internal/interceptors"
	"dnsarc/internal/models"
)

type DNSRecordHandler struct {
	db  *gorm.DB
	rdb *redis.Client
}

func NewDNSRecordHandler(db *gorm.DB, rdb *redis.Client) *DNSRecordHandler {
	return &DNSRecordHandler{db: db, rdb: rdb}
}

func (h *DNSRecordHandler) PublishEvent(event event.Event) {
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

func (h *DNSRecordHandler) CreateDNSRecord(ctx context.Context, req *connect.Request[dns_recordv1.CreateDNSRecordRequest]) (*connect.Response[dns_recordv1.CreateDNSRecordResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	name := strings.ToLower(req.Msg.Name) // 这里 name 是 @ 或者 api 这种，需要转换为 name
	name = strings.TrimSuffix(name, ".")
	var zone models.Zone
	if err := h.db.Where("user_id = ? AND zone_name = ?", userID, req.Msg.ZoneName).First(&zone).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}
	// 拼接成完整的 name
	if name == "@" || name == "" {
		name = zone.ZoneName
	} else {
		name = name + "." + zone.ZoneName
	}
	record := models.DNSRecord{
		UserID:   userID,
		ZoneID:   zone.ID,
		ZoneName: zone.ZoneName,
		Name:     name,
		Type:     req.Msg.Type,
		Content:  req.Msg.Content,
		TTL:      int(req.Msg.Ttl),
	}
	if err := h.db.Create(&record).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	go func() {
		h.PublishEvent(event.Event{
			Type:     event.EventTypeDNSRecordCreate,
			ZoneName: zone.ZoneName,
		})
	}()
	return &connect.Response[dns_recordv1.CreateDNSRecordResponse]{
		Msg: &dns_recordv1.CreateDNSRecordResponse{
			Record: record.ToProto(),
		},
	}, nil
}

func (h *DNSRecordHandler) ListDNSRecords(ctx context.Context, req *connect.Request[dns_recordv1.ListDNSRecordsRequest]) (*connect.Response[dns_recordv1.ListDNSRecordsResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	var records []models.DNSRecord
	if err := h.db.Where("user_id = ? AND zone_id = ?", userID, req.Msg.ZoneId).Find(&records).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return &connect.Response[dns_recordv1.ListDNSRecordsResponse]{
		Msg: &dns_recordv1.ListDNSRecordsResponse{
			Records: lo.Map(records, func(record models.DNSRecord, _ int) *dns_recordv1.DNSRecord {
				return record.ToProto()
			}),
		},
	}, nil
}

func (h *DNSRecordHandler) ListDNSRecordsByZoneName(ctx context.Context, req *connect.Request[dns_recordv1.ListDNSRecordsByZoneNameRequest]) (*connect.Response[dns_recordv1.ListDNSRecordsByZoneNameResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	var records []models.DNSRecord
	if err := h.db.Where("user_id = ? AND zone_name = ?", userID, req.Msg.ZoneName).Find(&records).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	return &connect.Response[dns_recordv1.ListDNSRecordsByZoneNameResponse]{
		Msg: &dns_recordv1.ListDNSRecordsByZoneNameResponse{
			Records: lo.Map(records, func(record models.DNSRecord, _ int) *dns_recordv1.DNSRecord {
				return record.ToProto()
			}),
		},
	}, nil
}

func (h *DNSRecordHandler) GetDNSRecord(ctx context.Context, req *connect.Request[dns_recordv1.GetDNSRecordRequest]) (*connect.Response[dns_recordv1.GetDNSRecordResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	var record models.DNSRecord
	if err := h.db.Where("user_id = ? AND id = ?", userID, req.Msg.Id).First(&record).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}
	return &connect.Response[dns_recordv1.GetDNSRecordResponse]{
		Msg: &dns_recordv1.GetDNSRecordResponse{Record: record.ToProto()},
	}, nil
}

func (h *DNSRecordHandler) UpdateDNSRecord(ctx context.Context, req *connect.Request[dns_recordv1.UpdateDNSRecordRequest]) (*connect.Response[dns_recordv1.UpdateDNSRecordResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	var record models.DNSRecord
	if err := h.db.Where("user_id = ? AND id = ?", userID, req.Msg.Id).First(&record).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}
	name := strings.ToLower(req.Msg.Name)
	name = strings.TrimSuffix(name, ".")
	updateMap := map[string]any{}
	if name != "" {
		updateMap["name"] = name
	}
	if req.Msg.Type != "" {
		updateMap["type"] = req.Msg.Type
	}
	if req.Msg.Content != "" {
		updateMap["content"] = req.Msg.Content
	}
	if req.Msg.Ttl != 0 {
		updateMap["ttl"] = int(req.Msg.Ttl)
	}
	if err := h.db.Model(&record).Updates(updateMap).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	go func() {
		h.PublishEvent(event.Event{
			Type:     event.EventTypeDNSRecordUpdate,
			ZoneName: record.ZoneName,
		})
	}()
	return &connect.Response[dns_recordv1.UpdateDNSRecordResponse]{
		Msg: &dns_recordv1.UpdateDNSRecordResponse{
			Record: record.ToProto(),
		},
	}, nil
}

func (h *DNSRecordHandler) DeleteDNSRecord(ctx context.Context, req *connect.Request[dns_recordv1.DeleteDNSRecordRequest]) (*connect.Response[dns_recordv1.DeleteDNSRecordResponse], error) {
	userID, _ := interceptors.GetUserID(ctx)
	var record models.DNSRecord
	if err := h.db.Where("user_id = ? AND id = ?", userID, req.Msg.Id).First(&record).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}
	if err := h.db.Where("user_id = ? AND id = ?", userID, req.Msg.Id).Delete(&models.DNSRecord{}).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	go func() {
		h.PublishEvent(event.Event{
			Type:     event.EventTypeDNSRecordDelete,
			ZoneName: record.ZoneName,
		})
	}()
	return &connect.Response[dns_recordv1.DeleteDNSRecordResponse]{}, nil
}
