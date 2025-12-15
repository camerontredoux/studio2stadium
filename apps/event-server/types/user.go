package types

type User struct {
	Id        string `json:"id" gorm:"primaryKey"`
	FirstName string `json:"firstName" gorm:"column:first_name"`
	LastName  string `json:"lastName" gorm:"column:last_name"`
	Username  string `json:"username" gorm:"column:username"`
	Image     string `json:"image" gorm:"column:image"`
}

func (User) TableName() string {
	return "users"
}
