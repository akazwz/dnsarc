package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type DNSRecord struct {
	ID        string    `json:"id" gorm:"primaryKey"`
	Domain    string    `json:"domain"`
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
