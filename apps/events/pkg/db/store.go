package db

type Store struct {
	Postgres *Postgres
}

type StoreConfig struct {
	PostgresDSN string
}

func NewStore(config *StoreConfig) (*Store, error) {
	postgres, err := NewPostgres(config.PostgresDSN)
	if err != nil {
		return nil, err
	}
	return &Store{
		Postgres: postgres,
	}, nil
}

func (s Store) Close() error {
	if err := s.Postgres.Close(); err != nil {
		return err
	}
	return nil
}
