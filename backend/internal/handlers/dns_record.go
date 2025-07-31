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
	domain := strings.ToLower(req.Msg.Domain)
	var zone models.Zone
	if err := h.db.Where("user_id = ? AND domain = ?", userID, domain).First(&zone).Error; err != nil {
		return nil, connect.NewError(connect.CodeNotFound, err)
	}
	record := models.DNSRecord{
		UserID: userID,
		ZoneID: zone.ID,
		Domain: domain,
		Type:   req.Msg.Type,
		Value:  req.Msg.Value,
		TTL:    int(req.Msg.Ttl),
	}
	if err := h.db.Create(&record).Error; err != nil {
		return nil, connect.NewError(connect.CodeInternal, err)
	}
	go func() {
		h.PublishEvent(event.Event{
			Type:   event.EventTypeDNSRecordCreate,
			Domain: domain,
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
	if err := h.db.Where("user_id = ? AND domain = ?", userID, req.Msg.Domain).Find(&records).Error; err != nil {
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
			Type:   event.EventTypeDNSRecordDelete,
			Domain: record.Domain,
		})
	}()
	return &connect.Response[dns_recordv1.DeleteDNSRecordResponse]{}, nil
}
