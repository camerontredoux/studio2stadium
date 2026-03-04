package types

import (
	"encoding/json"
	"time"
)

type GlobalNotification struct {
	Id        string          `json:"id"        gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Content   json.RawMessage `json:"content"   gorm:"type:jsonb;not null"`
	CreatedAt time.Time       `json:"createdAt" gorm:"column:created_at"`
}

func (GlobalNotification) TableName() string {
	return "global_notifications"
}

type Notification struct {
	Id        string          `json:"id"        gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	UserId    string          `json:"userId"    gorm:"column:user_id;not null"`
	Content   json.RawMessage `json:"content"   gorm:"type:jsonb;not null"`
	CreatedAt time.Time       `json:"createdAt" gorm:"column:created_at"`

	User *User `json:"user" gorm:"foreignKey:Id;references:UserId"`
}

func (Notification) TableName() string {
	return "notifications"
}

// Event payload types matching TypeScript outbox-service.ts

// school.interest - dancer shows interest in a school
type SchoolInterestPayload struct {
	DancerId string `json:"dancerId"`
	SchoolId string `json:"schoolId"`
}

// dancer.favorite - school favorites a dancer
type DancerFavoritePayload struct {
	SchoolId string `json:"schoolId"`
	DancerId string `json:"dancerId"`
	Platform string `json:"platform"`
}

// school.followed - dancer follows a school
type SchoolFollowedPayload struct {
	DancerId string `json:"dancerId"`
	SchoolId string `json:"schoolId"`
}

// crv.submission - dancer submits CRV to a school
type CRVSubmissionPayload struct {
	DancerId string `json:"dancerId"`
	SchoolId string `json:"schoolId"`
	VideoId  string `json:"videoId"`
}

// dancer.profile-viewed - school views dancer profile
type DancerProfileViewedPayload struct {
	DancerId string `json:"dancerId"`
	SchoolId string `json:"schoolId"`
}

// dancer.prospect-status - school updates dancer's prospect status
type DancerProspectStatusPayload struct {
	DancerId string `json:"dancerId"`
	SchoolId string `json:"schoolId"`
	Status   string `json:"status"`
}

// dancer.image-uploaded - dancer uploads profile image
type DancerImageUploadedPayload struct {
	DancerId string `json:"dancerId"`
}

// dancer.video-uploaded - dancer uploads video
type DancerVideoUploadedPayload struct {
	DancerId string `json:"dancerId"`
}

// dancer.reference-added - dancer adds reference
type DancerReferenceAddedPayload struct {
	DancerId string `json:"dancerId"`
}

// dancer.achievement-added - dancer adds achievement
type DancerAchievementAddedPayload struct {
	DancerId string `json:"dancerId"`
}

// school.event-created - school creates an event
type SchoolEventCreatedPayload struct {
	SchoolId string `json:"schoolId"`
	EventId  string `json:"eventId"`
}

// school.image-uploaded - school uploads image
type SchoolImageUploadedPayload struct {
	SchoolId string `json:"schoolId"`
}

// school.video-uploaded - school uploads video
type SchoolVideoUploadedPayload struct {
	SchoolId string `json:"schoolId"`
}

// event.attended - user attends event
type EventAttendedPayload struct {
	UserId  string `json:"userId"`
	EventId string `json:"eventId"`
}

// school.approved - school is approved (global notification)
type SchoolApprovedPayload struct {
	SchoolId string `json:"schoolId"`
}

// video.ready - video upload finished processing
type VideoReadyPayload struct {
	UserId  string `json:"userId"`
	VideoId string `json:"videoId"`
}

// video.failed - video upload failed processing
type VideoFailedPayload struct {
	UserId       string `json:"userId"`
	ErrorMessage string `json:"errorMessage"`
}

// Notification content types (stored in notifications.content)
// Each includes a "type" field so frontend can identify the notification type
// Additional fields contain minimal reference data for rendering

type SchoolInterestContent struct {
	Type     string `json:"type"`
	DancerId string `json:"dancerId"`
}

type DancerFavoriteContent struct {
	Type     string `json:"type"`
	SchoolId string `json:"schoolId"`
	Platform string `json:"platform"`
}

type SchoolFollowedContent struct {
	Type     string `json:"type"`
	DancerId string `json:"dancerId"`
}

type CRVSubmissionContent struct {
	Type     string `json:"type"`
	DancerId string `json:"dancerId"`
	VideoId  string `json:"videoId"`
}

type DancerProfileViewedContent struct {
	Type     string `json:"type"`
	SchoolId string `json:"schoolId"`
}

type DancerProspectStatusContent struct {
	Type     string `json:"type"`
	SchoolId string `json:"schoolId"`
	Status   string `json:"status"`
}

type DancerProfileUpdateContent struct {
	Type       string `json:"type"`
	DancerId   string `json:"dancerId"`
	UpdateType string `json:"updateType"` // "image", "video", "reference", "achievement"
}

type SchoolEventCreatedContent struct {
	Type     string `json:"type"`
	SchoolId string `json:"schoolId"`
	EventId  string `json:"eventId"`
}

type SchoolContentUpdateContent struct {
	Type       string `json:"type"`
	SchoolId   string `json:"schoolId"`
	UpdateType string `json:"updateType"` // "image", "video"
}

type SchoolApprovedContent struct {
	Type     string `json:"type"`
	SchoolId string `json:"schoolId"`
}

type EventAttendedContent struct {
	Type    string `json:"type"`
	UserId  string `json:"userId"`
	EventId string `json:"eventId"`
}

type VideoReadyContent struct {
	Type    string `json:"type"`
	VideoId string `json:"videoId"`
}

type VideoFailedContent struct {
	Type         string `json:"type"`
	ErrorMessage string `json:"errorMessage"`
}
