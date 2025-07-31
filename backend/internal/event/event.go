package event

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
	Type   EventType `json:"type"`
	Domain string    `json:"domain"`
}
