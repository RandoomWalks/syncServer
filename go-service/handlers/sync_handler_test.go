package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"go-service/models"
)

func TestSyncHandler(t *testing.T) {
	reqBody := SyncRequest{
		Data: []models.ChangeDTO{
			{Type: "create", Data: map[string]interface{}{"_id": "1", "name": "test"}},
			{Type: "update", Data: map[string]interface{}{"_id": "1", "name": "updated"}},
		},
	}
	body, _ := json.Marshal(reqBody)
	req, err := http.NewRequest("POST", "/sync", bytes.NewBuffer(body))
	if err != nil {
		t.Fatal(err)
	}

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(SyncHandler)

	handler.ServeHTTP(rr, req)

	if status := rr.Code; status != http.StatusOK {
		t.Errorf("handler returned wrong status code: got %v want %v",
			status, http.StatusOK)
	}

	var resp SyncResponse
	err = json.NewDecoder(rr.Body).Decode(&resp)
	if err != nil {
		t.Fatal(err)
	}

	if len(resp.Result) != len(reqBody.Data) {
		t.Errorf("handler returned unexpected number of results: got %v want %v",
			len(resp.Result), len(reqBody.Data))
	}

	for i, res := range resp.Result {
		if res.Type != reqBody.Data[i].Type || res.Data["_id"] != reqBody.Data[i].Data["_id"] {
			t.Errorf("handler returned unexpected result: got %v want %v",
				res, reqBody.Data[i])
		}
	}
}
