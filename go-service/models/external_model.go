// models/external_model.go
package models

type ChangeDTO struct {
	Type string                 `json:"type"`
	Data map[string]interface{} `json:"data"`
}
