package presenters

import (
	"encoding/json"

	t "github.com/StudioToStadium/event-server/types"
)

func FavoritePayloadToNotification(payload t.FavoriteNotificationPayload, favoriter *t.User) (*t.Notification, error) {
	content := map[string]*t.User{
		"favoriter": favoriter,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return nil, err
	}
	return &t.Notification{
		UserId:  payload.FavoritedId,
		Content: contentJson,
	}, nil
}
