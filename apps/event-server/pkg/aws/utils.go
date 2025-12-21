package aws

import (
	"encoding/json"
	"errors"

	t "github.com/StudioToStadium/event-server/types"
	sqsT "github.com/aws/aws-sdk-go-v2/service/sqs/types"
)

func ParseMessageBody(message *sqsT.Message) (*t.QueueMessage, error) {
	var parsedEvent t.QueueMessage
	if message.Body == nil {
		return nil, errors.New("message body is nil")
	}
	err := json.Unmarshal([]byte(*message.Body), &parsedEvent)
	if err != nil {
		return nil, err
	}
	return &parsedEvent, nil
}
