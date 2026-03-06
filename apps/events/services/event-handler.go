package services

import (
	"encoding/json"

	t "github.com/StudioToStadium/event-server/types"
)

// HandleSchoolInterest - dancer shows interest in a school
// Notifies the school's user
func (s *EventService) HandleSchoolInterest(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.SchoolInterestPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get school profile to find user ID
	school, err := s.store.GetSchoolProfile(payload.SchoolId)
	if err != nil {
		return err
	}

	content := t.SchoolInterestContent{
		Type:     "school.interest",
		DancerId: payload.DancerId,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	*notifications = []*t.Notification{{
		UserId:  school.UserId,
		Content: contentJson,
	}}
	return nil
}

// HandleDancerFavorite - school favorites a dancer
// Notifies the dancer
func (s *EventService) HandleDancerFavorite(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.DancerFavoritePayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get dancer profile to find user ID
	dancer, err := s.store.GetDancerProfile(payload.DancerId)
	if err != nil {
		return err
	}

	content := t.DancerFavoriteContent{
		Type:     "dancer.favorite",
		SchoolId: payload.SchoolId,
		Platform: payload.Platform,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	*notifications = []*t.Notification{{
		UserId:  dancer.UserId,
		Content: contentJson,
	}}
	return nil
}

// HandleSchoolFollowed - dancer follows a school
// Notifies the school's user
func (s *EventService) HandleSchoolFollowed(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.SchoolFollowedPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get school profile to find user ID
	school, err := s.store.GetSchoolProfile(payload.SchoolId)
	if err != nil {
		return err
	}

	content := t.SchoolFollowedContent{
		Type:     "school.followed",
		DancerId: payload.DancerId,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	*notifications = []*t.Notification{{
		UserId:  school.UserId,
		Content: contentJson,
	}}
	return nil
}

// HandleCRVSubmission - dancer submits CRV to a school
// Notifies the school's user
func (s *EventService) HandleCRVSubmission(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.CRVSubmissionPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get school profile to find user ID
	school, err := s.store.GetSchoolProfile(payload.SchoolId)
	if err != nil {
		return err
	}

	content := t.CRVSubmissionContent{
		Type:     "crv.submission",
		DancerId: payload.DancerId,
		VideoId:  payload.VideoId,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	*notifications = []*t.Notification{{
		UserId:  school.UserId,
		Content: contentJson,
	}}
	return nil
}

// HandleDancerProfileViewed - school views dancer profile
// Notifies the dancer
func (s *EventService) HandleDancerProfileViewed(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.DancerProfileViewedPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get dancer profile to find user ID
	dancer, err := s.store.GetDancerProfile(payload.DancerId)
	if err != nil {
		return err
	}

	content := t.DancerProfileViewedContent{
		Type:     "dancer.profile-viewed",
		SchoolId: payload.SchoolId,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	*notifications = []*t.Notification{{
		UserId:  dancer.UserId,
		Content: contentJson,
	}}
	return nil
}

// HandleDancerProspectStatus - school updates dancer's prospect status
// Notifies the dancer
func (s *EventService) HandleDancerProspectStatus(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.DancerProspectStatusPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get dancer profile to find user ID
	dancer, err := s.store.GetDancerProfile(payload.DancerId)
	if err != nil {
		return err
	}

	content := t.DancerProspectStatusContent{
		Type:     "dancer.prospect-status",
		SchoolId: payload.SchoolId,
		Status:   payload.Status,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	*notifications = []*t.Notification{{
		UserId:  dancer.UserId,
		Content: contentJson,
	}}
	return nil
}

// HandleDancerImageUploaded - dancer uploads profile image
// Notifies all schools that favorited this dancer
func (s *EventService) HandleDancerImageUploaded(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.DancerImageUploadedPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get all school users that favorited this dancer
	userIds, err := s.store.GetDancerFavoriters(payload.DancerId)
	if err != nil {
		return err
	}

	content := t.DancerProfileUpdateContent{
		Type:       "dancer.image-uploaded",
		DancerId:   payload.DancerId,
		UpdateType: "image",
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	notifs := make([]*t.Notification, 0, len(userIds))
	for _, userId := range userIds {
		notifs = append(notifs, &t.Notification{
			UserId:  userId,
			Content: contentJson,
		})
	}

	*notifications = notifs
	return nil
}

// HandleDancerVideoUploaded - dancer uploads video
// Notifies all schools that favorited this dancer
func (s *EventService) HandleDancerVideoUploaded(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.DancerVideoUploadedPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get all school users that favorited this dancer
	userIds, err := s.store.GetDancerFavoriters(payload.DancerId)
	if err != nil {
		return err
	}

	content := t.DancerProfileUpdateContent{
		Type:       "dancer.video-uploaded",
		DancerId:   payload.DancerId,
		UpdateType: "video",
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	notifs := make([]*t.Notification, 0, len(userIds))
	for _, userId := range userIds {
		notifs = append(notifs, &t.Notification{
			UserId:  userId,
			Content: contentJson,
		})
	}

	*notifications = notifs
	return nil
}

// HandleDancerReferenceAdded - dancer adds reference
// Notifies all schools that favorited this dancer
func (s *EventService) HandleDancerReferenceAdded(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.DancerReferenceAddedPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get all school users that favorited this dancer
	userIds, err := s.store.GetDancerFavoriters(payload.DancerId)
	if err != nil {
		return err
	}

	content := t.DancerProfileUpdateContent{
		Type:       "dancer.reference-added",
		DancerId:   payload.DancerId,
		UpdateType: "reference",
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	notifs := make([]*t.Notification, 0, len(userIds))
	for _, userId := range userIds {
		notifs = append(notifs, &t.Notification{
			UserId:  userId,
			Content: contentJson,
		})
	}

	*notifications = notifs
	return nil
}

// HandleDancerAchievementAdded - dancer adds achievement
// Notifies all schools that favorited this dancer
func (s *EventService) HandleDancerAchievementAdded(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.DancerAchievementAddedPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get all school users that favorited this dancer
	userIds, err := s.store.GetDancerFavoriters(payload.DancerId)
	if err != nil {
		return err
	}

	content := t.DancerProfileUpdateContent{
		Type:       "dancer.achievement-added",
		DancerId:   payload.DancerId,
		UpdateType: "achievement",
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	notifs := make([]*t.Notification, 0, len(userIds))
	for _, userId := range userIds {
		notifs = append(notifs, &t.Notification{
			UserId:  userId,
			Content: contentJson,
		})
	}

	*notifications = notifs
	return nil
}

// HandleSchoolEventCreated - school creates an event
// Notifies all dancers that follow this school
func (s *EventService) HandleSchoolEventCreated(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.SchoolEventCreatedPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get all dancer users that follow this school
	userIds, err := s.store.GetSchoolFollowers(payload.SchoolId)
	if err != nil {
		return err
	}

	content := t.SchoolEventCreatedContent{
		Type:     "school.event-created",
		SchoolId: payload.SchoolId,
		EventId:  payload.EventId,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	notifs := make([]*t.Notification, 0, len(userIds))
	for _, userId := range userIds {
		notifs = append(notifs, &t.Notification{
			UserId:  userId,
			Content: contentJson,
		})
	}

	*notifications = notifs
	return nil
}

// HandleSchoolImageUploaded - school uploads image
// Notifies all dancers that follow this school
func (s *EventService) HandleSchoolImageUploaded(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.SchoolImageUploadedPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get all dancer users that follow this school
	userIds, err := s.store.GetSchoolFollowers(payload.SchoolId)
	if err != nil {
		return err
	}

	content := t.SchoolContentUpdateContent{
		Type:       "school.image-uploaded",
		SchoolId:   payload.SchoolId,
		UpdateType: "image",
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	notifs := make([]*t.Notification, 0, len(userIds))
	for _, userId := range userIds {
		notifs = append(notifs, &t.Notification{
			UserId:  userId,
			Content: contentJson,
		})
	}

	*notifications = notifs
	return nil
}

// HandleSchoolVideoUploaded - school uploads video
// Notifies all dancers that follow this school
func (s *EventService) HandleSchoolVideoUploaded(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.SchoolVideoUploadedPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get all dancer users that follow this school
	userIds, err := s.store.GetSchoolFollowers(payload.SchoolId)
	if err != nil {
		return err
	}

	content := t.SchoolContentUpdateContent{
		Type:       "school.video-uploaded",
		SchoolId:   payload.SchoolId,
		UpdateType: "video",
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	notifs := make([]*t.Notification, 0, len(userIds))
	for _, userId := range userIds {
		notifs = append(notifs, &t.Notification{
			UserId:  userId,
			Content: contentJson,
		})
	}

	*notifications = notifs
	return nil
}

// HandleSchoolApproved - school is approved
// Fans out notification to all users
func (s *EventService) HandleSchoolApproved(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.SchoolApprovedPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get all user IDs for fan-out
	userIds, err := s.store.GetAllUserIds()
	if err != nil {
		return err
	}

	content := t.SchoolApprovedContent{
		Type:     "school.approved",
		SchoolId: payload.SchoolId,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	notifs := make([]*t.Notification, 0, len(userIds))
	for _, userId := range userIds {
		notifs = append(notifs, &t.Notification{
			UserId:  userId,
			Content: contentJson,
		})
	}

	*notifications = notifs
	return nil
}

// HandleBlogPostCreated - blog post is created
// Fans out notification to all users
func (s *EventService) HandleBlogPostCreated(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.BlogPostCreatedPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get all user IDs for fan-out
	userIds, err := s.store.GetAllUserIds()
	if err != nil {
		return err
	}

	content := t.BlogPostCreatedContent{
		Type:   "blog.post-created",
		PostId: payload.PostId,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	notifs := make([]*t.Notification, 0, len(userIds))
	for _, userId := range userIds {
		notifs = append(notifs, &t.Notification{
			UserId:  userId,
			Content: contentJson,
		})
	}

	*notifications = notifs
	return nil
}

// HandleEventAttended - user attends an event
// Notifies the school that created the event
func (s *EventService) HandleEventAttended(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.EventAttendedPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	// Get the event to find the school
	event, err := s.store.GetDanceEvent(payload.EventId)
	if err != nil {
		return err
	}

	// Get school profile to find user ID
	school, err := s.store.GetSchoolProfile(event.SchoolId)
	if err != nil {
		return err
	}

	content := t.EventAttendedContent{
		Type:    "event.attended",
		UserId:  payload.UserId,
		EventId: payload.EventId,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	*notifications = []*t.Notification{{
		UserId:  school.UserId,
		Content: contentJson,
	}}
	return nil
}

// HandleVideoReady - video upload finished processing
// Notifies the user who uploaded the video
func (s *EventService) HandleVideoReady(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.VideoReadyPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	content := t.VideoReadyContent{
		Type:    "video.ready",
		VideoId: payload.VideoId,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	*notifications = []*t.Notification{{
		UserId:  payload.UserId,
		Content: contentJson,
	}}
	return nil
}

// HandleVideoFailed - video upload failed processing
// Notifies the user who uploaded the video
func (s *EventService) HandleVideoFailed(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var payload t.VideoFailedPayload
	if err := outboxEvent.GetPayload(&payload); err != nil {
		return err
	}

	content := t.VideoFailedContent{
		Type:         "video.failed",
		ErrorMessage: payload.ErrorMessage,
	}
	contentJson, err := json.Marshal(content)
	if err != nil {
		return err
	}

	*notifications = []*t.Notification{{
		UserId:  payload.UserId,
		Content: contentJson,
	}}
	return nil
}
