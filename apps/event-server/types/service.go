package types

type QueueMessage struct {
	EventId   string `json:"eventId"`
	EventType string `json:"eventType"`
}
