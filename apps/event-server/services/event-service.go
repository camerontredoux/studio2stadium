package services

import (
	"log"

	sqsT "github.com/aws/aws-sdk-go-v2/service/sqs/types"
	"github.com/davecgh/go-spew/spew"

	b "github.com/StudioToStadium/event-server/behavior"
	t "github.com/StudioToStadium/event-server/types"

	"github.com/StudioToStadium/event-server/pkg/aws"
	"github.com/StudioToStadium/event-server/pkg/db"
)

type EventService struct {
	aws   *aws.AWSClient
	store *b.BehaviorStore
}

func NewEventService(aws *aws.AWSClient, db *db.Store) *EventService {
	return &EventService{aws: aws, store: b.NewBehaviorStore(db)}
}

func (s *EventService) ProcessEvents() error {
	res, err := s.aws.ReceiveMessage()
	if err != nil {
		log.Println("Error receiving message from SQS", err)
		return err
	}
	if len(res.Messages) == 0 {
		log.Println("No messages received from SQS")
		return nil
	}

	successfullReceiptHandles := []*string{}
	for _, message := range res.Messages {
		processedMessage, err := s.ProcessQueueMessage(&message)
		if err != nil {
			log.Printf(
				"Error processing message %s, retrying in 1 minute: %v\n",
				*message.MessageId,
				err,
			)
			continue
		}

		if processedMessage != nil {
			log.Printf(
				"Processed message: %s:%s",
				processedMessage.EventId,
				processedMessage.EventType,
			)
			successfullReceiptHandles = append(successfullReceiptHandles, message.ReceiptHandle)
		}
	}

	if len(successfullReceiptHandles) > 0 {
		err = s.aws.DeleteMessageBatch(successfullReceiptHandles)
		if err != nil {
			log.Println("Error deleting messages from SQS", err)
			return err
		}
	}

	return nil
}

func (s *EventService) ProcessQueueMessage(message *sqsT.Message) (*t.QueueMessage, error) {
	parsedEvent, err := aws.ParseMessageBody(message)
	if err != nil {
		return nil, err
	}
	log.Printf("Processing message %s", parsedEvent.EventId)

	if _, err := s.store.GetProcessedEvent(parsedEvent.EventId); err == nil {
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
	outboxEvent, err := s.store.GetOutboxEvent(parsedEvent.EventId)
	if err != nil {
		return nil, err
	}

	processedEvent := &t.ProcessedEvent{
		EventId:   parsedEvent.EventId,
		EventType: parsedEvent.EventType,
	}

	var notifications []*t.Notification
	var globalNotification *t.GlobalNotification

	switch outboxEvent.Type {
	case "favorite":
		err := s.HandleFavoriteEvent(outboxEvent, &notifications)
		if err != nil {
			return nil, err
		}
	case "crv-submission":
		err := s.HandleCRVSubmissionEvent(outboxEvent, &notifications)
		if err != nil {
			return nil, err
		}
	case "school-joined": // TODO: global event
		err := s.HandleSchoolJoinedEvent(outboxEvent, &globalNotification)
		if err != nil {
			return nil, err
		}
	case "coach-attending": // when a coach clicks "attending" button on event (global dance event), send to all dancers following this coach
	case "crv-viewed": // when a coach views a CRV (common recruiting video), send to submitter
	case "video-comment": // coach comments on dancer video, send to dancer
	case "dancer-profile-updated": // alerts all schools following a dancer that a profile was updated
		// json payload of event to contain what was updated (award, reference, video, etc.)
	case "school-viewed-profile": // alerts a dancer that a school viewed their profile
	case "school-added-event": // alerts all dancers following a school that a new event was added
	case "tap-in-video-uploaded": // TODO: global event, to all dancers (paying)
	default:
		log.Println("Unhandled event type:", outboxEvent.Type)
	}

	if len(notifications) > 0 {
		log.Printf(
			"Creating notifications and processed event\nNotifications: %s\nProcessedEvent: %s\n",
			spew.Sdump(notifications),
			spew.Sdump(processedEvent),
		)
		err = s.store.CreateNotificationsAndEvent(notifications, processedEvent)
		if err != nil {
			return nil, err
		}
	}
	if globalNotification != nil {
		log.Printf(
			"Creating global notification and processed event\nGlobalNotification: %s\nProcessedEvent: %s\n",
			spew.Sdump(globalNotification),
			spew.Sdump(processedEvent),
		)
		err = s.store.CreateGlobalNotificationAndEvent(globalNotification, processedEvent)
		if err != nil {
			return nil, err
		}
	}

	return parsedEvent, nil
}
