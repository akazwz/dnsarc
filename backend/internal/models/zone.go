package models

import (
	zonev1 "dnsarc/gen/zone/v1"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Zone struct {
	ID        string `gorm:"primaryKey"`
	UserID    string `json:"user_id"`
	Domain    string // without . at the end
	IsActive  bool
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
		Domain:    z.Domain,
		IsActive:  z.IsActive,
		CreatedAt: z.CreatedAt.Format(time.RFC3339),
		UpdatedAt: z.UpdatedAt.Format(time.RFC3339),
	}
}
