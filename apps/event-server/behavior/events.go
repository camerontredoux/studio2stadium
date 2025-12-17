package behavior

import (
	t "github.com/StudioToStadium/event-server/types"
	"gorm.io/gorm"
)

func (s *BehaviorStore) GetProcessedEvent(eventId string) (*t.ProcessedEvent, error) {
	res := t.ProcessedEvent{}
	err := s.db.Postgres.GetDB().Where("event_id = ?", eventId).First(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (s *BehaviorStore) CreateProcessedEvent(event *t.ProcessedEvent) (*t.ProcessedEvent, error) {
	res := t.ProcessedEvent{
		EventId:   event.EventId,
		EventType: event.EventType,
	}
	err := s.db.Postgres.GetDB().Create(&res).Error
	return &res, err
}

func (s *BehaviorStore) GetOutboxEvent(eventId string) (*t.OutboxEvent, error) {
	res := t.OutboxEvent{}
	err := s.db.Postgres.GetDB().Where("id = ?", eventId).First(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (s *BehaviorStore) CreateNotificationsAndEvent(
	notifications []*t.Notification,
	event *t.ProcessedEvent,
) error {
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

func (s *BehaviorStore) CreateGlobalNotificationAndEvent(
	notification *t.GlobalNotification,
	event *t.ProcessedEvent,
) error {
	return s.db.Postgres.GetDB().Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&notification).Error; err != nil {
			return err
		}
		if err := tx.Create(&event).Error; err != nil {
			return err
		}
		return nil
	})
}
