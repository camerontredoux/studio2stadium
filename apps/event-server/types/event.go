package types

import (
	"encoding/json"
	"time"
)

type Event struct {
	Id        string `json:"id"`
	EventType string `json:"eventType"`
}

type OutboxEvent struct {
	Id          string          `gorm:"primaryKey"`
	Type        string          `gorm:"type:varchar(255);not null"`
	Payload     json.RawMessage `gorm:"type:jsonb;not null"`
	CreatedAt   time.Time       `gorm:"column:created_at"`
	PublishedAt *time.Time      `gorm:"column:published_at"`
}

func (OutboxEvent) TableName() string {
	return "outbox"
}

type ProcessedEvent struct {
	EventId     string    `json:"eventId"   bson:"_id"`
	EventType   string    `json:"eventType" bson:"eventType"`
	ProcessedAt time.Time `json:"processedAt" bson:"processedAt"`
}
