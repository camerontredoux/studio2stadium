package presenters

import (
	"encoding/json"

	t "github.com/StudioToStadium/event-server/types"
)

func SchoolJoinedPayloadToNotification(
	payload t.SchoolJoinedNotificationPayload,
	school *t.School,
) (*t.GlobalNotification, error) {
	content := map[string]*t.School{
		"school": school,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return nil, err
	}
	return &t.GlobalNotification{
		Content: contentJson,
	}, nil
}
