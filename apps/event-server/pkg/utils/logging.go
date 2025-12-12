package utils

import (
	"log"

	"github.com/davecgh/go-spew/spew"
)

func SpewLog(v any, customMsg ...string) {
	if len(customMsg) > 0 {
		log.Printf("%s:\n%s", customMsg[0], spew.Sdump(v))
	} else {
		log.Println(spew.Sdump(v))
	}
}
