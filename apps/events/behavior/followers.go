package behavior

// DancerFollow represents the dancer_follows table
type DancerFollow struct {
	Id       string `gorm:"primaryKey"`
	DancerId string `gorm:"column:dancer_id"`
	SchoolId string `gorm:"column:school_id"`
}

func (DancerFollow) TableName() string {
	return "dancer_follows"
}

// SchoolFavorite represents the school_favorites table
type SchoolFavorite struct {
	Id           string `gorm:"primaryKey"`
	SchoolId     string `gorm:"column:school_id"`
	DancerId     string `gorm:"column:dancer_id"`
	PlatformName string `gorm:"column:platform_name"`
}

func (SchoolFavorite) TableName() string {
	return "school_favorites"
}

// DancerProfile for lookups
type DancerProfile struct {
	Id     string `gorm:"primaryKey"`
	UserId string `gorm:"column:user_id"`
}

func (DancerProfile) TableName() string {
	return "dancer_profiles"
}

// SchoolProfile for lookups
type SchoolProfile struct {
	Id     string `gorm:"primaryKey"`
	UserId string `gorm:"column:user_id"`
	Name   string `gorm:"column:name"`
}

func (SchoolProfile) TableName() string {
	return "school_profiles"
}

// GetDancerProfile gets a dancer profile by ID
func (s *BehaviorStore) GetDancerProfile(dancerId string) (*DancerProfile, error) {
	res := DancerProfile{}
	err := s.db.Postgres.GetDB().Where("id = ?", dancerId).First(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

// GetDancerProfileByUserId gets a dancer profile by user ID
func (s *BehaviorStore) GetDancerProfileByUserId(userId string) (*DancerProfile, error) {
	res := DancerProfile{}
	err := s.db.Postgres.GetDB().Where("user_id = ?", userId).First(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

// GetSchoolProfile gets a school profile by ID
func (s *BehaviorStore) GetSchoolProfile(schoolId string) (*SchoolProfile, error) {
	res := SchoolProfile{}
	err := s.db.Postgres.GetDB().Where("id = ?", schoolId).First(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

// GetSchoolProfileByUserId gets a school profile by user ID
func (s *BehaviorStore) GetSchoolProfileByUserId(userId string) (*SchoolProfile, error) {
	res := SchoolProfile{}
	err := s.db.Postgres.GetDB().Where("user_id = ?", userId).First(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

// GetSchoolFollowers gets all dancer user IDs that follow a school
func (s *BehaviorStore) GetSchoolFollowers(schoolId string) ([]string, error) {
	var follows []DancerFollow
	err := s.db.Postgres.GetDB().
		Where("school_id = ?", schoolId).
		Find(&follows).Error
	if err != nil {
		return nil, err
	}

	// Get user IDs from dancer profiles
	userIds := make([]string, 0, len(follows))
	for _, f := range follows {
		var profile DancerProfile
		err := s.db.Postgres.GetDB().Where("id = ?", f.DancerId).First(&profile).Error
		if err != nil {
			continue // Skip if profile not found
		}
		userIds = append(userIds, profile.UserId)
	}

	return userIds, nil
}

// GetDancerFavoriters gets all school user IDs that favorited a dancer
func (s *BehaviorStore) GetDancerFavoriters(dancerId string) ([]string, error) {
	var favorites []SchoolFavorite
	err := s.db.Postgres.GetDB().
		Where("dancer_id = ?", dancerId).
		Find(&favorites).Error
	if err != nil {
		return nil, err
	}

	// Get user IDs from school profiles
	userIds := make([]string, 0, len(favorites))
	for _, f := range favorites {
		var profile SchoolProfile
		err := s.db.Postgres.GetDB().Where("id = ?", f.SchoolId).First(&profile).Error
		if err != nil {
			continue // Skip if profile not found
		}
		userIds = append(userIds, profile.UserId)
	}

	return userIds, nil
}

// DanceEvent for lookups
type DanceEvent struct {
	Id       string `gorm:"primaryKey"`
	SchoolId string `gorm:"column:school_id"`
	Title    string `gorm:"column:title"`
}

func (DanceEvent) TableName() string {
	return "dance_events"
}

// GetDanceEvent gets a dance event by ID
func (s *BehaviorStore) GetDanceEvent(eventId string) (*DanceEvent, error) {
	res := DanceEvent{}
	err := s.db.Postgres.GetDB().Where("id = ?", eventId).First(&res).Error
	if err != nil {
		return nil, err
	}
	return &res, nil
}

