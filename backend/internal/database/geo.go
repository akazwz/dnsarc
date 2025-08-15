package database

import (
	"github.com/oschwald/geoip2-golang/v2"
)

func NewGeoDB() (*geoip2.Reader, error) {
	db, err := geoip2.Open("./data/GeoLite2-City.mmdb")
	if err != nil {
		return nil, err
	}
	return db, nil
}
