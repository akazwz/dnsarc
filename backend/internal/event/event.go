package event

import (
	"context"
	"encoding/json"
	"log/slog"

	"github.com/redis/go-redis/v9"
)

type EventType string

const (
	EventTypeDNSRecordCreate EventType = "dns_record_create"
	EventTypeDNSRecordUpdate EventType = "dns_record_update"
	EventTypeDNSRecordDelete EventType = "dns_record_delete"
	EventTypeZoneCreate      EventType = "zone_create"
	EventTypeZoneUpdate      EventType = "zone_update"
	EventTypeZoneDelete      EventType = "zone_delete"
)

type Event struct {
	Type     EventType `json:"type"`
	ZoneName string    `json:"zone_name"`
}

func PublishEvent(rdb *redis.Client, event Event) {
	ctx := context.Background()
	slog.Info("publish event", "event", event)
	json, err := json.Marshal(event)
	if err != nil {
		slog.Error("failed to marshal event", "error", err)
		return
	}
	if err := rdb.Publish(ctx, "event", string(json)).Err(); err != nil {
		slog.Error("failed to publish event", "error", err)
	}
}
