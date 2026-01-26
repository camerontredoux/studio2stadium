package aws

import (
	"context"
	"errors"
	"fmt"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/sqs"
	sqsT "github.com/aws/aws-sdk-go-v2/service/sqs/types"
)

type AWSConfig struct {
	AWSAccessKeyID     string
	AWSSecretAccessKey string
	AWSRegion          string
	QueueURL           string
	DeadLetterQueueURL string
}

func (awsConfig *AWSConfig) Validate() error {
	if awsConfig.AWSAccessKeyID == "" {
		return errors.New("AWS Access Key ID is required")
	}
	if awsConfig.AWSSecretAccessKey == "" {
		return errors.New("AWS Secret Access Key is required")
	}
	if awsConfig.AWSRegion == "" {
		return errors.New("AWS region is required")
	}
	if awsConfig.QueueURL == "" {
		return errors.New("queue URL is required")
	}
	if awsConfig.DeadLetterQueueURL == "" {
		return errors.New("dead letter queue URL is required")
	}
	return nil
}

type AWSClient struct {
	cfg                aws.Config
	sqs                *sqs.Client
	queueURL           string
	deadLetterQueueURL string
}

func NewAWSClient(awsConfig *AWSConfig) (*AWSClient, error) {
	if err := awsConfig.Validate(); err != nil {
		return nil, err
	}

	cfg, err := config.LoadDefaultConfig(
		context.TODO(),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(
				awsConfig.AWSAccessKeyID, awsConfig.AWSSecretAccessKey, ""),
		),
		config.WithRegion(awsConfig.AWSRegion),
	)
	if err != nil {
		return nil, err
	}

	sqsClient := sqs.NewFromConfig(cfg)

	return &AWSClient{
		cfg:                cfg,
		sqs:                sqsClient,
		queueURL:           awsConfig.QueueURL,
		deadLetterQueueURL: awsConfig.DeadLetterQueueURL,
	}, nil
}

func (awsClient *AWSClient) ReceiveMessage() (*sqs.ReceiveMessageOutput, error) {
	return awsClient.receiveMessage(awsClient.queueURL)
}

func (awsClient *AWSClient) receiveMessage(queueURL string) (*sqs.ReceiveMessageOutput, error) {
	return awsClient.sqs.ReceiveMessage(context.TODO(), &sqs.ReceiveMessageInput{
		QueueUrl:            aws.String(queueURL),
		MaxNumberOfMessages: *aws.Int32(10),
		WaitTimeSeconds:     *aws.Int32(20),
		VisibilityTimeout:   *aws.Int32(60), // seconds
	})
}

func (awsClient *AWSClient) DeleteMessage(receiptHandle *string) error {
	return awsClient.deleteMessage(awsClient.queueURL, receiptHandle)
}

func (awsClient *AWSClient) deleteMessage(queueURL string, receiptHandle *string) error {
	// delete messages in batch with DeleteMessageBatch
	_, err := awsClient.sqs.DeleteMessage(context.TODO(), &sqs.DeleteMessageInput{
		QueueUrl:      aws.String(queueURL),
		ReceiptHandle: receiptHandle,
	})
	if err != nil {
		return err
	}
	return nil
}

func (awsClient *AWSClient) DeleteMessageBatch(receiptHandles []*string) error {
	return awsClient.deleteMessageBatch(awsClient.queueURL, receiptHandles)
}

func (awsClient *AWSClient) deleteMessageBatch(queueURL string, receiptHandles []*string) error {
	entries := make([]sqsT.DeleteMessageBatchRequestEntry, len(receiptHandles))
	for i, receiptHandle := range receiptHandles {
		entries[i] = sqsT.DeleteMessageBatchRequestEntry{
			Id:            aws.String(fmt.Sprintf("delete-message-batch-%d", i)),
			ReceiptHandle: receiptHandle,
		}
	}

	_, err := awsClient.sqs.DeleteMessageBatch(context.TODO(), &sqs.DeleteMessageBatchInput{
		QueueUrl: aws.String(queueURL),
		Entries:  entries,
	})
	if err != nil {
		return err
	}
	return nil
}
