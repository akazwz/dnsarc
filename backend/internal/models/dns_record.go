package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	dns_recordv1 "dnsarc/gen/dns_record/v1"
)

type DNSRecord struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	UserID    string    `json:"user_id" gorm:"index"`
	ZoneID    string    `json:"zone_id" gorm:"index"`
	ZoneName  string    `json:"zone_name" gorm:"index"` // 冗余字段，用于缓存
	Name      string    `json:"name"`
	Type      string    `json:"type"`
	Content   string    `json:"content"`
	Weight    int       `json:"weight"` // 权重, 用于负载均衡
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
		Name:      r.Name,
		Type:      r.Type,
		Content:   r.Content,
		Ttl:       int32(r.TTL),
		Weight:    int32(r.Weight),
		CreatedAt: r.CreatedAt.Format(time.RFC3339),
		UpdatedAt: r.UpdatedAt.Format(time.RFC3339),
	}
}
