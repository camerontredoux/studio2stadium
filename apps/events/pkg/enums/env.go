package enums

import "errors"

type Env string

const (
	Development Env = "development"
	Production  Env = "production"
)

func (e Env) Validate() error {
	if e != Development && e != Production {
		return errors.New("invalid environment")
	}
	return nil
}
