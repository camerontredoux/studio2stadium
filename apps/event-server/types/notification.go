package types

import (
	"encoding/json"
	"time"
)

type GlobalNotification struct {
	// TODO: implement
}

type Notification struct {
	Id        string          `json:"id" gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserId    string          `json:"userId" gorm:"column:user_id;not null"`
	Content   json.RawMessage `json:"content" gorm:"type:jsonb;not null"`
	CreatedAt time.Time       `json:"createdAt" gorm:"column:created_at"`

	User *User `json:"user" gorm:"foreignKey:Id;references:UserId"`
}

func (Notification) TableName() string {
	return "notifications"
}

type FavoriteNotificationPayload struct {
	FavoriterId string `json:"favoriterId"`
	FavoritedId string `json:"favoritedId"`
}

type CRVSubmissionNotificationPayload struct {
	DancerId  string   `json:"dancerId"`
	SchoolIds []string `json:"schoolIds"`
}

type SchoolJoinedNotificationPayload struct {
	SchoolId string `json:"schoolId"`
}

// TODO: maybe nuke?
type BlogPostNotificationPayload struct {
	PostId string `json:"postId"`
}
