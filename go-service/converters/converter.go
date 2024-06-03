// converters/converter.go
package converters

import (
	"time"

	"go-service/models"
)

func ToInternal(changeDTO models.ChangeDTO) models.Change {
	return models.Change{
		ID:        changeDTO.Data["_id"].(string), // Assuming data contains _id
		Type:      changeDTO.Type,
		Data:      changeDTO.Data,
		UpdatedAt: time.Now(),
	}
}

func ToExternal(change models.Change) models.ChangeDTO {
	return models.ChangeDTO{
		Type: change.Type,
		Data: change.Data,
	}
}
