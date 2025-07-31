package dns

import (
	"context"
	"time"

	"github.com/hashicorp/golang-lru/v2/expirable"
	"golang.org/x/sync/singleflight"
	"gorm.io/gorm"

	"dnsarc/internal/models"
)

// DNSCache DNS缓存管理器
type DNSCache struct {
	cache *expirable.LRU[string, []models.DNSRecord]
	db    *gorm.DB
	group singleflight.Group
}

// NewDNSCache 创建新的DNS缓存
func NewDNSCache(db *gorm.DB, size int, ttl time.Duration) (*DNSCache, error) {
	cache := expirable.NewLRU[string, []models.DNSRecord](size, nil, ttl)
	return &DNSCache{
		cache: cache,
		db:    db,
	}, nil
}

// GetRecords 获取DNS记录，优先从缓存获取, 缓存整个zone的记录
func (dc *DNSCache) GetRecords(ctx context.Context, zoneName string) ([]models.DNSRecord, error) {
	// 先从缓存获取
	if records, found := dc.cache.Get(zoneName); found {
		return records, nil
	}

	// 缓存未命中，使用singleflight防止缓存击穿
	result, err, _ := dc.group.Do(zoneName, func() (any, error) {
		// 再次检查缓存（双重检查锁定模式）
		if records, found := dc.cache.Get(zoneName); found {
			return records, nil
		}

		// 从数据库查询整个zone的记录
		var records []models.DNSRecord
		if err := dc.db.Where("zone_name = ?", zoneName).Find(&records).Error; err != nil {
			return nil, err
		}

		// 只有当有记录时才存入缓存
		if len(records) > 0 {
			dc.cache.Add(zoneName, records)
		}
		return records, nil
	})

	if err != nil {
		return nil, err
	}

	return result.([]models.DNSRecord), nil
}

func (dc *DNSCache) InvalidateCache(zoneName string) {
	dc.cache.Remove(zoneName)
}
