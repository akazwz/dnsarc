package models

import (
	zonev1 "dnsarc/gen/zone/v1"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Zone struct {
	ID        string    `gorm:"primaryKey"`
	UserID    string    `json:"user_id" gorm:"index"`
	ZoneName  string    `json:"zone_name" gorm:"index"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (Zone) TableName() string {
	return "zones"
}

func (z *Zone) BeforeCreate(tx *gorm.DB) (err error) {
	z.ID = uuid.New().String()
	return
}

func (z *Zone) ToProto() *zonev1.Zone {
	return &zonev1.Zone{
		Id:        z.ID,
		ZoneName:  z.ZoneName,
		IsActive:  z.IsActive,
		CreatedAt: z.CreatedAt.Format(time.RFC3339),
		UpdatedAt: z.UpdatedAt.Format(time.RFC3339),
	}
}
