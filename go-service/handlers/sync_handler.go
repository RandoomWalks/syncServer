// handlers/sync_handler.go
package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	// "go-service/converters"
	"go-service/models"
)

type SyncRequest struct {
	Data []models.ChangeDTO `json:"data"`
}

type SyncResponse struct {
	Result []models.ChangeDTO `json:"result"`
}

func processData(data models.ChangeDTO, resultChan chan models.ChangeDTO, logPrefix string) {
	processedData := data
	processedData.Data["status"] = "processed"
	log.Printf("%sProcessed data: %s", logPrefix, processedData.Data["_id"])
	resultChan <- processedData
}

func SyncHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Received request")

	var req SyncRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		log.Printf("Error decoding request: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("Request data: %v", req.Data)

	var wg sync.WaitGroup
	resultChan := make(chan models.ChangeDTO, len(req.Data))
	logPrefix := "[SyncHandler] "

	for _, data := range req.Data {
		wg.Add(1)
		go func(d models.ChangeDTO) {
			defer wg.Done()
			processData(d, resultChan, logPrefix)
		}(data)
	}

	go func() {
		wg.Wait()
		close(resultChan)
	}()

	var results []models.ChangeDTO
	for res := range resultChan {
		results = append(results, res)
	}
	log.Printf("Processed results: %v", results)

	resp := SyncResponse{Result: results}
	if err := json.NewEncoder(w).Encode(resp); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Println("Response sent successfully")
}
