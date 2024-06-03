// models/internal_model.go
package models

import "time"

type Change struct {
	ID        string                 `bson:"_id"`
	Type      string                 `bson:"type"`
	Data      map[string]interface{} `bson:"data"`
	UpdatedAt time.Time              `bson:"updated_at"`
}
