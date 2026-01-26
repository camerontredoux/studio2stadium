package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/robfig/cron/v3"

	"github.com/StudioToStadium/event-server/pkg/aws"
	"github.com/StudioToStadium/event-server/pkg/db"

	"github.com/StudioToStadium/event-server/services"
	// https://github.com/oliveroneill/exponent-server-sdk-golang
)

func main() {
	err := godotenv.Load("cmd/.env")
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	pgDSN := os.Getenv("POSTGRES_DSN")
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

	store, err := db.NewStore(&db.StoreConfig{
		PostgresDSN: pgDSN,
	})
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

	c := cron.New()
	// dancer has not uploaded shit
	_, err = c.AddFunc("CRON_TZ=America/Denver 0 9 1 * *", func() {

	})
	if err != nil {
		log.Fatalf("Error adding cron job: %v", err)
	}
	// upcoming events (weekly), sent on fridays for the following sunday-saturday
	_, err = c.AddFunc("CRON_TZ=America/Denver 0 17 * * 5", func() {
		// 1. insert notifications for all upcoming events
		// 2. insert notifications for school.followingDancers -> school upcoming events

		// Event.where("start, end ? [s, e]").each do |event|
		//  1. event.attendees.each{|a| a.notifications.create(event: e) // global dance events, not specific to one user
		//  2. event.owner.followingDancers.each{|d| d.notifications.create(event: e)
		// end
	})
	if err != nil {
		log.Fatalf("Error adding cron job: %v", err)
	}
	// application deadline, only for schools that dancers follow
	// TODO: add feature for schools to enter application deadline
	_, err = c.AddFunc("CRON_TZ=America/Denver 0 9 * * 5", func() {

	})
	if err != nil {
		log.Fatalf("Error adding cron job: %v", err)
	}
	c.Run()

	for {
		err := eventService.ProcessEvents()
		if err != nil {
			log.Println("Error processing events", err)
			continue
		}
	}
}
