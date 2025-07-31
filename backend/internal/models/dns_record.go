package models

import (
	dns_recordv1 "dnsarc/gen/dns_record/v1"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DNSRecord struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	UserID    string    `json:"user_id"`
	ZoneID    string    `json:"zone_id"`
	Domain    string    `json:"domain"` // without trailing dot
	Type      string    `json:"type"`
	Value     string    `json:"value"`
	TTL       int       `json:"ttl"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (DNSRecord) TableName() string {
	return "dns_records"
}

func (r *DNSRecord) BeforeCreate(tx *gorm.DB) (err error) {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	return
}

func (r *DNSRecord) ToProto() *dns_recordv1.DNSRecord {
	return &dns_recordv1.DNSRecord{
		Id:        r.ID,
		Domain:    r.Domain,
		Type:      r.Type,
		Value:     r.Value,
		Ttl:       int32(r.TTL),
		CreatedAt: r.CreatedAt.Format(time.RFC3339),
		UpdatedAt: r.UpdatedAt.Format(time.RFC3339),
	}
}
