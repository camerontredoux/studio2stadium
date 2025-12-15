package services

import (
	"log"

	"github.com/StudioToStadium/event-server/pkg/aws"
	"github.com/StudioToStadium/event-server/pkg/db"
)

type EventService struct {
	aws *aws.AWSClient
	db  *db.Store
}

func NewEventService(aws *aws.AWSClient, db *db.Store) *EventService {
	return &EventService{aws: aws, db: db}
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

	for _, message := range res.Messages {
		processedMessage, err := s.ProcessQueueMessage(&message)
		if err != nil {
			// log.Printf("Error processing message %s, retrying in 1 minute", *message.MessageId)
			log.Println("Error processing message", err)
			continue
		}

		if processedMessage != nil {
			log.Printf("Processed message: %s:%s", processedMessage.EventId, processedMessage.EventType)
		}
	}

	// create record in mongo for status of this event id
	// - upsert record with status = pending, event_id

	// fetch event from sql

	// create corresponding notification record in mongo (inside a transaction)
	// - using sql event info
	// - set recipient id, content (json payload but in a defined structure per message)
	// - update event status to completed (done)

	// delete message from sqs (ACK)

	// for _, message := range res.Messages {
	// 	err = s.aws.DeleteMessage(message.ReceiptHandle)
	// 	if err != nil {
	// 		log.Println("Error deleting message from SQS", err)
	// 		return err
	// 	}
	// }
	return nil
}
