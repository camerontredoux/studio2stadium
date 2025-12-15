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

// ex.
// var payload FavoriteNotificationPayload
// err := o.GetPayload(&payload)
//
//	if err != nil {
//		return err
//	}
func (o *OutboxEvent) GetPayload(out any) error {
	var payloadStr string
	err := json.Unmarshal(o.Payload, &payloadStr)
	if err != nil {
		return err
	}
	err = json.Unmarshal([]byte(payloadStr), out)
	if err != nil {
		return err
	}
	return nil
}

func (OutboxEvent) TableName() string {
	return "outbox"
}

type ProcessedEvent struct {
	EventId   string    `json:"eventId"   gorm:"primaryKey;column:event_id"`
	EventType string    `json:"eventType" gorm:"column:event_type"`
	CreatedAt time.Time `json:"createdAt" gorm:"column:created_at"`
}

func (ProcessedEvent) TableName() string {
	return "processed_events"
}
