package services

import (
	"encoding/json"
	"errors"
	"log"
	"time"

	"github.com/StudioToStadium/event-server/pkg/db"
	t "github.com/StudioToStadium/event-server/types"
	"github.com/aws/aws-sdk-go-v2/service/sqs/types"
	"github.com/davecgh/go-spew/spew"
)

type QueueMessage struct {
	EventType string `json:"eventType"`
	EventId   string `json:"eventId"`
}

func UpsertProcessedEvent(s *db.Store, eventId string, eventType string) (*t.ProcessedEvent, error) {
	processedEvent := &t.ProcessedEvent{
		EventId:     eventId,
		EventType:   eventType,
		ProcessedAt: time.Now(),
	}

	res := t.ProcessedEvent{}
	err := s.Upsert(
		s.DbCollection("s2s_events", "processed_events"),
		db.M{"eventId": eventId},
		processedEvent,
		&res,
	)
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func GetProcessedEvent(s *db.Store, eventId string) (*t.ProcessedEvent, error) {
	res := t.ProcessedEvent{}
	err := s.FindOne(
		s.DbCollection("s2s_events", "processed_events"),
		db.M{"eventId": eventId},
		&res,
	)
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (s *EventService) ProcessQueueMessage(message *types.Message) (*QueueMessage, error) {
	parseMessage := func(message *types.Message) (*QueueMessage, error) {
		var parsedEvent QueueMessage
		if message.Body == nil {
			return nil, errors.New("message body is nil")
		}
		err := json.Unmarshal([]byte(*message.Body), &parsedEvent)
		if err != nil {
			return nil, err
		}
		return &parsedEvent, nil
	}

	parsedEvent, err := parseMessage(message)
	if err != nil {
		return nil, err
	}
	log.Printf("Processing message %s", parsedEvent.EventId)

	if _, err := GetProcessedEvent(s.db, parsedEvent.EventId); err == nil {
		log.Printf(
			"Event data already exists for event id %s - deleting\n",
			parsedEvent.EventId,
		)
		err = s.aws.DeleteMessage(message.ReceiptHandle)
		if err != nil {
			log.Println("Error deleting message from SQS", err)
			return nil, err
		}
		return nil, nil
	}

	log.Println("Event has not been processed, querying from Postgres with id", parsedEvent.EventId)
	var outboxEvent t.OutboxEvent

	res := s.db.Postgres.GetDB().Table("outbox").Where("id = ?", parsedEvent.EventId).First(&outboxEvent)
	if res.Error != nil {
		return nil, res.Error
	}
	spew.Dump(outboxEvent)

	switch outboxEvent.Type {
	case "favorite":
		spew.Dump(outboxEvent.Payload)
	case "crv-submission":
		spew.Dump(outboxEvent.Payload)
	case "school-recently-joined":
		spew.Dump(outboxEvent.Payload)
	case "blog-post":
		spew.Dump(outboxEvent.Payload)
	default:
		log.Println("Unhandled event type", outboxEvent.Type)
	}

	log.Println("Storing processed event in processed_events")
	// after everything succeeds, upsert event data (in a transaction)
	_, err = UpsertProcessedEvent(s.db, parsedEvent.EventId, parsedEvent.EventType)
	if err != nil {
		log.Println("Error upserting event data", err)
		return nil, err
	}

	err = s.aws.DeleteMessage(message.ReceiptHandle)
	if err != nil {
		log.Println("Error deleting message from SQS", err)
		return nil, err
	}
	log.Println("Deleted message for event", parsedEvent.EventId)

	return parsedEvent, nil
}
