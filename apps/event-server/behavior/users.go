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
