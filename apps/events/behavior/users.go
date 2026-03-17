package behavior

import (
	t "github.com/StudioToStadium/event-server/types"
)

func (s *BehaviorStore) GetUser(userId string) (*t.User, error) {
	res := t.User{}
	err := s.db.Postgres.GetDB().Where("id = ?", userId).First(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

func (s *BehaviorStore) GetSchool(schoolId string) (*t.School, error) {
	res := t.School{}
	err := s.db.Postgres.GetDB().Where("id = ?", schoolId).First(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

// GetAllUserIds returns all user IDs for fan-out notifications
func (s *BehaviorStore) GetAllUserIds() ([]string, error) {
	var userIds []string
	err := s.db.Postgres.GetDB().
		Table("users").
		Pluck("id", &userIds).Error
	if err != nil {
		return nil, err
	}
	return userIds, nil
}

// GetSubscribedUserIds returns user IDs with active subscriptions
func (s *BehaviorStore) GetSubscribedUserIds() ([]string, error) {
	var userIds []string
	err := s.db.Postgres.GetDB().
		Table("user_subscriptions").
		Where("status = ?", "active").
		Pluck("user_id", &userIds).Error
	if err != nil {
		return nil, err
	}
	return userIds, nil
}
