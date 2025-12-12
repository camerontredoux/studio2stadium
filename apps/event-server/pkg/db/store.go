package db

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Store struct {
	mongo    *mongo.Client
	postgres *Postgres
}

type StoreConfig struct {
	MongoConnectionString string
	PostgresDSN           string
}

func NewStore(mongoConnectionString string, postgresDSN string) (*Store, error) {
	log.Println("Creating store with MongoDB connection string:", mongoConnectionString)
	mongo, err := newMongoClient(mongoConnectionString)
	if err != nil {
		return nil, err
	}
	postgres, err := NewPostgres(postgresDSN)
	if err != nil {
		return nil, err
	}
	return &Store{
		mongo:    mongo,
		postgres: postgres,
	}, nil
}

func (s Store) Close() error {
	if err := s.mongo.Disconnect(context.Background()); err != nil {
		return err
	}
	if err := s.postgres.Close(); err != nil {
		return err
	}
	return nil
}

func (s Store) Disconnect() error {
	return s.mongo.Disconnect(context.Background())
}

func (s Store) DB(dbname string) *mongo.Database {
	return s.mongo.Database(dbname)
}

func (s Store) DbCollection(dbname string, name string) *mongo.Collection {
	return s.DB(dbname).Collection(name)
}

func (s Store) Insert(col *mongo.Collection, data interface{}) error {
	return insert(col, data)
}

func (s Store) InsertMany(col *mongo.Collection, data []interface{}) error {
	return insertMany(col, data)
}

func (s Store) Update(col *mongo.Collection, filter M, data interface{}, out interface{}) error {
	return update(col, filter, data, out)
}

func (s Store) UpdateMany(col *mongo.Collection, filter M, data []interface{}) error {
	return updateMany(col, filter, data)
}

func (s Store) Upsert(col *mongo.Collection, filter M, data interface{}, out interface{}) error {
	return upsert(col, filter, data, out)
}

func (s Store) Delete(col *mongo.Collection, filter M, out interface{}) error {
	return delete(col, filter, out)
}

func (s Store) DeleteMany(col *mongo.Collection, filter M) error {
	return deleteMany(col, filter)
}

func (s Store) Aggregate(col *mongo.Collection, pipe []M, out interface{}) error {
	return aggregate(col, pipe, out)
}

func (s Store) FindOne(col *mongo.Collection, filter M, out interface{}) error {
	return findOne(col, filter, out)
}

func (s Store) Find(
	col *mongo.Collection,
	filter M,
	options *options.FindOptions,
	out interface{},
) error {
	return find(col, filter, options, out)
}
