package db

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type M bson.M

func newMongoClient(uri string) (*mongo.Client, error) {
	return mongo.Connect(context.TODO(), options.Client().ApplyURI(uri))
}

func insert(col *mongo.Collection, data interface{}) error {
	_, err := col.InsertOne(context.Background(), data)
	return err
}

func insertMany(col *mongo.Collection, data []interface{}) error {
	_, err := col.InsertMany(context.Background(), data)
	return err
}

func update(col *mongo.Collection, filter M, data interface{}, out interface{}) error {
	return col.FindOneAndUpdate(context.TODO(), filter, M{"$set": data}).Decode(out)
}

func updateMany(col *mongo.Collection, filter M, data interface{}) error {
	_, err := col.UpdateMany(context.TODO(), filter, M{"$set": data})
	if err != nil {
		return err
	}
	return nil
}

func upsert(col *mongo.Collection, filter M, data interface{}, out interface{}) error {
	return col.FindOneAndUpdate(
		context.TODO(),
		filter,
		M{"$set": data},
		options.FindOneAndUpdate().SetUpsert(true).SetReturnDocument(options.After),
	).Decode(out)
}

func delete(col *mongo.Collection, filter M, out interface{}) error {
	return col.FindOneAndDelete(context.TODO(), filter).Decode(out)
}

func deleteMany(col *mongo.Collection, filter M) error {
	_, err := col.DeleteMany(context.TODO(), filter)
	return err
}

func aggregate(col *mongo.Collection, pipe []M, out interface{}) error {
	if cur, err := col.Aggregate(context.TODO(), pipe); err == nil {
		return cur.All(context.TODO(), out)
	} else {
		return err
	}
}

func findOne(col *mongo.Collection, filter M, out interface{}) error {
	return col.FindOne(context.TODO(), filter).Decode(out)
}

func find(col *mongo.Collection, filter M, options *options.FindOptions, out interface{}) error {
	if cur, err := col.Find(context.TODO(), filter, options); err == nil {
		return cur.All(context.TODO(), out)
	} else {
		return err
	}
}
