package behavior

import (
	"github.com/StudioToStadium/event-server/pkg/db"
)

type BehaviorStore struct {
	db *db.Store
}

func NewBehaviorStore(db *db.Store) *BehaviorStore {
	return &BehaviorStore{db: db}
}
