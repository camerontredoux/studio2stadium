package types

type School struct {
	Id   string `json:"id"   gorm:"primaryKey;type:uuid;default:gen_random_uuid()"`
	Name string `json:"name" gorm:"column:name;not null;unique"`
}

func (School) TableName() string {
	return "school_accounts"
}
