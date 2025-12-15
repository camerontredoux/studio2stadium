package services

import (
	"gorm.io/gorm"

	t "github.com/StudioToStadium/event-server/types"
)

type QueueMessage struct {
	EventType string `json:"eventType"`
	EventId   string `json:"eventId"`
}

func (s *EventService) GetProcessedEvent(eventId string) (*t.ProcessedEvent, error) {
	res := t.ProcessedEvent{}
	err := s.db.Postgres.GetDB().Where("event_id = ?", eventId).First(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (s *EventService) CreateProcessedEvent(event *t.ProcessedEvent) (*t.ProcessedEvent, error) {
	res := t.ProcessedEvent{
		EventId:   event.EventId,
		EventType: event.EventType,
	}
	err := s.db.Postgres.GetDB().Create(&res).Error
	return &res, err
}

func (s *EventService) GetOutboxEvent(eventId string) (*t.OutboxEvent, error) {
	res := t.OutboxEvent{}
	err := s.db.Postgres.GetDB().Where("id = ?", eventId).First(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (s *EventService) GetUser(userId string) (*t.User, error) {
	res := t.User{}
	err := s.db.Postgres.GetDB().Where("id = ?", userId).First(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (s *EventService) CreateNotification(notification *t.Notification) error {
	return s.db.Postgres.GetDB().Create(&notification).Error
}

func (s *EventService) CreateManyNotifications(notifications []*t.Notification) error {
	return s.db.Postgres.GetDB().Create(&notifications).Error
}

func (s *EventService) CreateNotificationsAndEvent(notifications []*t.Notification, event *t.ProcessedEvent) error {
	return s.db.Postgres.GetDB().Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&notifications).Error; err != nil {
			return err
		}
		if err := tx.Create(&event).Error; err != nil {
			return err
		}
		return nil
	})
}
