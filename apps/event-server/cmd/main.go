package main

import (
	"log"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/robfig/cron/v3"

	"github.com/StudioToStadium/event-server/pkg/aws"
	"github.com/StudioToStadium/event-server/pkg/db"

	"github.com/StudioToStadium/event-server/services"
)

func main() {
	err := godotenv.Load("cmd/.env")
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	pgDSN := os.Getenv("POSTGRES_DSN")
	mongoConnectionString := os.Getenv("MONGO_CONNECTION_STRING")
	awsAccessKeyID := os.Getenv("AWS_ACCESS_KEY_ID")
	awsSecretAccessKey := os.Getenv("AWS_SECRET_KEY")
	awsRegion := os.Getenv("AWS_REGION")
	awsQueueURL := os.Getenv("SQS_QUEUE_URL")
	awsDeadLetterQueueURL := os.Getenv("SQS_DEAD_LETTER_QUEUE_URL")

	aws, err := aws.NewAWSClient(&aws.AWSConfig{
		AWSAccessKeyID:     awsAccessKeyID,
		AWSSecretAccessKey: awsSecretAccessKey,
		AWSRegion:          awsRegion,
		QueueURL:           awsQueueURL,
		DeadLetterQueueURL: awsDeadLetterQueueURL,
	})
	if err != nil {
		log.Fatalf("Error creating AWS client: %v", err)
	}

	store, err := db.NewStore(mongoConnectionString, pgDSN)
	if err != nil {
		log.Fatalf("Error creating store: %v", err)
	}
	defer func() {
		err := store.Close()
		if err != nil {
			log.Fatalf("Error closing store: %v", err)
		}
	}()
	eventService := services.NewEventService(aws, store)

	loc, err := time.LoadLocation("America/Denver")
	if err != nil {
		log.Fatalf("Error loading location: %v", err)
	}
	cr := cron.New(cron.WithLocation(loc))

	_, err = cr.AddFunc("*/1 * * * *", func() {
		log.Println("Processing dead letter events")
		err := eventService.ProcessDeadLetterEvents()
		if err != nil {
			log.Println("Error processing dead letter events", err)
		}
	})
	if err != nil {
		log.Fatalf("Error adding cron job: %v", err)
	}

	cr.Start()
	for {
		err := eventService.ProcessEvents()
		if err != nil {
			log.Println("Error processing events", err)
			continue
		}
	}
}
