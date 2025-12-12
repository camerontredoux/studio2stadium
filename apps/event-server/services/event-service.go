package services

import (
	"encoding/json"
	"errors"
	"log"

	"github.com/StudioToStadium/event-server/pkg/aws"
	"github.com/StudioToStadium/event-server/pkg/db"

	"github.com/aws/aws-sdk-go-v2/service/sqs/types"
)

type EventService struct {
	aws        *aws.AWSClient
	db         *db.Store
	eventCount int
}

func NewEventService(aws *aws.AWSClient, db *db.Store) *EventService {
	return &EventService{aws: aws, db: db, eventCount: 0}
}

func (s *EventService) ProcessEvents() error {
	// payload of event_id, and event_type
	res, err := s.aws.ReceiveMessage()
	if err != nil {
		log.Println("Error receiving message from SQS", err)
		return err
	}
	if len(res.Messages) == 0 {
		log.Println("No messages received from SQS")
		return nil
	}

	parseMessage := func(message *types.Message) (*struct {
		EventType string `json:"eventType"`
		EventId   string `json:"eventId"`
	}, error) {
		var processedEvent struct {
			EventType string `json:"eventType"`
			EventId   string `json:"eventId"`
		}
		if message.Body == nil {
			return nil, errors.New("message body is nil")
		}
		err := json.Unmarshal([]byte(*message.Body), &processedEvent)
		if err != nil {
			return nil, err
		}
		return &processedEvent, nil
	}

	for _, message := range res.Messages {
		s.eventCount++
		processedEvent, err := parseMessage(&message)
		if err != nil {
			log.Println("Error parsing message", err)
			return err
		}

		if _, err := GetEventData(s.db, processedEvent.EventId); err == nil {
			log.Printf(
				"Event data already exists for event id %s - deleting\n",
				processedEvent.EventId,
			)
			err = s.aws.DeleteMessage(message.ReceiptHandle)
			if err != nil {
				log.Println("Error deleting message from SQS", err)
				return err
			}
			continue
		}

		// after everything succeeds, upsert event data (in a transaction)
		_, err = UpsertEventData(s.db, processedEvent.EventId, processedEvent.EventType)
		if err != nil {
			log.Println("Error upserting event data", err)
			return err
		}
	}
	log.Printf("Processed %d events\n", s.eventCount)

	// create record in mongo for status of this event id
	// - upsert record with status = pending, event_id

	// fetch event from sql

	// create corresponding notification record in mongo (inside a transaction)
	// - using sql event info
	// - set recipient id, content (json payload but in a defined structure per message)
	// - update event status to completed (done)

	// delete message from sqs (ACK)
	for _, message := range res.Messages {
		err = s.aws.DeleteMessage(message.ReceiptHandle)
		if err != nil {
			log.Println("Error deleting message from SQS", err)
			return err
		}
	}
	return nil
}

func (s *EventService) ProcessDeadLetterEvents() error {
	res, err := s.aws.ReceiveDeadLetterMessages()
	if err != nil {
		log.Println("Error receiving message from SQS", err)
		return err
	}
	if len(res.Messages) == 0 {
		log.Println("No messages received from SQS")
		return nil
	}

	parseMessage := func(message *types.Message) error {
		var processedEvent struct {
			EventType string `json:"eventType"`
			EventId   string `json:"eventId"`
		}
		if message.Body == nil {
			return errors.New("message body is nil")
		}
		err := json.Unmarshal([]byte(*message.Body), &processedEvent)
		if err != nil {
			return err
		}
		return nil
	}

	for _, message := range res.Messages {
		err := parseMessage(&message)
		if err != nil {
			log.Println("Error parsing message", err)
		}
	}
	log.Printf("Processed %d events\n", s.eventCount)

	for _, message := range res.Messages {
		err = s.aws.DeleteDeadLetterMessage(message.ReceiptHandle)
		if err != nil {
			log.Println("Error deleting message from SQS", err)
			return err
		}
	}
	log.Printf("Deleted %d messages from SQS\n", len(res.Messages))
	return nil
}
