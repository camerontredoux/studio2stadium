package services

import (
	"encoding/json"
	"errors"
	"log"

	"github.com/aws/aws-sdk-go-v2/service/sqs/types"
	"github.com/davecgh/go-spew/spew"

	pr "github.com/StudioToStadium/event-server/presenters"
	t "github.com/StudioToStadium/event-server/types"

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
			log.Printf("Error processing message %s, retrying in 1 minute: %v\n", *message.MessageId, err)
			continue
		}

		if processedMessage != nil {
			log.Printf("Processed message: %s:%s", processedMessage.EventId, processedMessage.EventType)
			// TODO: batch delete messages from SQS
			err = s.aws.DeleteMessage(message.ReceiptHandle)
			if err != nil {
				log.Println("Error deleting message from SQS", err)
				return err
			}
			log.Println("Deleted message for event", processedMessage.EventId)
		}
	}
	return nil
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

	if _, err := s.GetProcessedEvent(parsedEvent.EventId); err == nil {
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
	outboxEvent, err := s.GetOutboxEvent(parsedEvent.EventId)
	if err != nil {
		return nil, err
	}
	spew.Dump(outboxEvent)

	processedEvent := &t.ProcessedEvent{
		EventId:   parsedEvent.EventId,
		EventType: parsedEvent.EventType,
	}

	var notifications []*t.Notification

	switch outboxEvent.Type {
	case "favorite":
		var fnPayload t.FavoriteNotificationPayload
		err := outboxEvent.GetPayload(&fnPayload)
		if err != nil {
			return nil, err
		}
		favoriter, err := s.GetUser(fnPayload.FavoriterId)
		if err != nil {
			return nil, err
		}
		notification, err := pr.FavoritePayloadToNotification(fnPayload, favoriter)
		if err != nil {
			return nil, err
		}
		notifications = append(notifications, notification)
	case "crv-submission":
		var crvSubmissionPayload t.CRVSubmissionNotificationPayload
		err := outboxEvent.GetPayload(&crvSubmissionPayload)
		if err != nil {
			return nil, err
		}
		dancer, err := s.GetUser(crvSubmissionPayload.DancerId)
		if err != nil {
			return nil, err
		}
		crvNotifications, err := pr.CrvSubmissionPayloadToNotification(crvSubmissionPayload, dancer)
		if err != nil {
			return nil, err
		}
		notifications = crvNotifications
	case "school-joined": // TODO: global event
		var schoolJoinedPayload t.SchoolJoinedNotificationPayload
		err := outboxEvent.GetPayload(&schoolJoinedPayload)
		if err != nil {
			return nil, err
		}
	case "blog-post": // TODO: remove bc global event
		var blogPostPayload t.BlogPostNotificationPayload
		err := outboxEvent.GetPayload(&blogPostPayload)
		if err != nil {
			return nil, err
		}
	default:
		log.Println("Unhandled event type:", outboxEvent.Type)
	}

	log.Printf("Creating notifications and processed event\nNotifications: %s\nProcessedEvent: %s\n", spew.Sdump(notifications), spew.Sdump(processedEvent))
	err = s.CreateNotificationsAndEvent(notifications, processedEvent)
	if err != nil {
		return nil, err
	}

	return parsedEvent, nil
}
