package services

import (
	"time"

	"github.com/StudioToStadium/event-server/pkg/db"
	t "github.com/StudioToStadium/event-server/types"
)

func UpsertEventData(s *db.Store, eventId string, eventType string) (*t.ProcessedEvent, error) {
	processedEvent := &t.ProcessedEvent{
		EventId:   eventId,
		EventType: eventType,
		CreatedAt: time.Now(),
	}

	res := t.ProcessedEvent{}
	err := s.Upsert(
		s.DbCollection("s2s-events", "processed_events"),
		db.M{"eventId": eventId},
		processedEvent,
		&res,
	)
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func GetEventData(s *db.Store, eventId string) (*t.ProcessedEvent, error) {
	res := t.ProcessedEvent{}
	err := s.FindOne(
		s.DbCollection("s2s-events", "processed_events"),
		db.M{"eventId": eventId},
		&res,
	)
	if err != nil {
		return nil, err
	}
	return &res, nil
}
