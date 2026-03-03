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
	// Dancer engagement events
	case "school.interest":
		err = s.HandleSchoolInterest(outboxEvent, &notifications)
	case "dancer.favorite":
		err = s.HandleDancerFavorite(outboxEvent, &notifications)
	case "school.followed":
		err = s.HandleSchoolFollowed(outboxEvent, &notifications)

	// Recruiting events
	case "crv.submission":
		err = s.HandleCRVSubmission(outboxEvent, &notifications)
	case "dancer.profile-viewed":
		err = s.HandleDancerProfileViewed(outboxEvent, &notifications)
	case "dancer.prospect-status":
		err = s.HandleDancerProspectStatus(outboxEvent, &notifications)

	// Dancer profile update events (notify favoriters)
	case "dancer.image-uploaded":
		err = s.HandleDancerImageUploaded(outboxEvent, &notifications)
	case "dancer.video-uploaded":
		err = s.HandleDancerVideoUploaded(outboxEvent, &notifications)
	case "dancer.reference-added":
		err = s.HandleDancerReferenceAdded(outboxEvent, &notifications)
	case "dancer.achievement-added":
		err = s.HandleDancerAchievementAdded(outboxEvent, &notifications)

	// School content events (notify followers)
	case "school.event-created":
		err = s.HandleSchoolEventCreated(outboxEvent, &notifications)
	case "school.image-uploaded":
		err = s.HandleSchoolImageUploaded(outboxEvent, &notifications)
	case "school.video-uploaded":
		err = s.HandleSchoolVideoUploaded(outboxEvent, &notifications)

	// Global notification events
	case "school.approved":
		err = s.HandleSchoolApproved(outboxEvent, &globalNotification)

	// Events that don't generate notifications
	case "user.signup":
		// No notification needed
	case "event.attended":
		// No notification needed for now

	default:
		log.Println("Unhandled event type:", outboxEvent.Type)
	}

	if err != nil {
		return nil, err
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
	} else if globalNotification != nil {
		log.Printf(
			"Creating global notification and processed event\nGlobalNotification: %s\nProcessedEvent: %s\n",
			spew.Sdump(globalNotification),
			spew.Sdump(processedEvent),
		)
		err = s.store.CreateGlobalNotificationAndEvent(globalNotification, processedEvent)
		if err != nil {
			return nil, err
		}
	} else {
		// Mark event as processed even if no notifications were generated
		_, err = s.store.CreateProcessedEvent(processedEvent)
		if err != nil {
			return nil, err
		}
	}

	return parsedEvent, nil
}
