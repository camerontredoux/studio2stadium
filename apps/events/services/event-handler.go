package services

import (
	pr "github.com/StudioToStadium/event-server/presenters"
	t "github.com/StudioToStadium/event-server/types"
)

func (s *EventService) HandleFavoriteEvent(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var fnPayload t.FavoriteNotificationPayload
	err := outboxEvent.GetPayload(&fnPayload)
	if err != nil {
		return err
	}
	favoriter, err := s.store.GetUser(fnPayload.FavoriterId)
	if err != nil {
		return err
	}
	notif, err := pr.FavoritePayloadToNotification(fnPayload, favoriter)
	if err != nil {
		return err
	}
	*notifications = []*t.Notification{notif}
	return nil
}

func (s *EventService) HandleCRVSubmissionEvent(
	outboxEvent *t.OutboxEvent,
	notifications *[]*t.Notification,
) error {
	var crvSubmissionPayload t.CRVSubmissionNotificationPayload
	err := outboxEvent.GetPayload(&crvSubmissionPayload)
	if err != nil {
		return err
	}

	dancer, err := s.store.GetUser(crvSubmissionPayload.DancerId)
	if err != nil {
		return err
	}
	crvNotifications, err := pr.CrvSubmissionPayloadToNotification(crvSubmissionPayload, dancer)
	if err != nil {
		return err
	}
	*notifications = crvNotifications
	return nil
}

func (s *EventService) HandleSchoolJoinedEvent(
	outboxEvent *t.OutboxEvent,
	globalNotification **t.GlobalNotification,
) error {
	var schoolJoinedPayload t.SchoolJoinedNotificationPayload
	err := outboxEvent.GetPayload(&schoolJoinedPayload)
	if err != nil {
		return err
	}
	school, err := s.store.GetSchool(schoolJoinedPayload.SchoolId)
	if err != nil {
		return err
	}
	notification, err := pr.SchoolJoinedPayloadToNotification(schoolJoinedPayload, school)
	if err != nil {
		return err
	}
	*globalNotification = notification
	return nil
}
