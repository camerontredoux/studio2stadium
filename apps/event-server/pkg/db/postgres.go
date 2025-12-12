package db

import (
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

type Postgres struct {
	db *gorm.DB
}

func NewPostgres(dsn string) (*Postgres, error) {
	db, err := gorm.Open(postgres.New(
		postgres.Config{
			DSN:                  dsn,
			PreferSimpleProtocol: true,
		}),
		&gorm.Config{},
	)
	if err != nil {
		return nil, err
	}

	return &Postgres{db: db}, nil
}

func (p *Postgres) GetDB() *gorm.DB {
	return p.db
}

func (p *Postgres) Close() error {
	db, err := p.db.DB()
	if err != nil {
		return err
	}
	return db.Close()
}
