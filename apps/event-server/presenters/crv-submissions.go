package presenters

import (
	"encoding/json"

	t "github.com/StudioToStadium/event-server/types"
)

func CrvSubmissionPayloadToNotification(payload t.CRVSubmissionNotificationPayload, dancer *t.User) ([]*t.Notification, error) {
	var notifications []*t.Notification
	content := map[string]*t.User{
		"dancer": dancer,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return nil, err
	}
	for _, schoolId := range payload.SchoolIds {
		notifications = append(notifications, &t.Notification{
			UserId:  schoolId,
			Content: contentJson,
		})
	}
	return notifications, nil
}
