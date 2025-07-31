package dns

import (
	"context"
	"time"

	"dnsarc/internal/models"

	"github.com/hashicorp/golang-lru/v2/expirable"
	"golang.org/x/sync/singleflight"
	"gorm.io/gorm"
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

// GetRecords 获取DNS记录，优先从缓存获取
func (dc *DNSCache) GetRecords(ctx context.Context, domain string) ([]models.DNSRecord, error) {
	// 先从缓存获取
	if records, found := dc.cache.Get(domain); found {
		return records, nil
	}

	// 缓存未命中，使用singleflight防止缓存击穿
	result, err, _ := dc.group.Do(domain, func() (any, error) {
		// 再次检查缓存（双重检查锁定模式）
		if records, found := dc.cache.Get(domain); found {
			return records, nil
		}

		// 从数据库查询
		var records []models.DNSRecord
		if err := dc.db.Where("domain = ?", domain).Find(&records).Error; err != nil {
			return nil, err
		}

		// 只有当有记录时才存入缓存
		if len(records) > 0 {
			dc.cache.Add(domain, records)
		}
		return records, nil
	})

	if err != nil {
		return nil, err
	}

	return result.([]models.DNSRecord), nil
}

func (dc *DNSCache) InvalidateCache(domain string) {
	dc.cache.Remove(domain)
}
