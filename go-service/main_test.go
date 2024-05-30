package main

import (
    "bytes"
    "encoding/json"
    "net/http"
    "net/http/httptest"
    "testing"

)

func TestSyncHandler(t *testing.T) {
    reqBody, _ := json.Marshal(SyncRequest{Data: []string{"test1", "test2", "test3"}})
    req, err := http.NewRequest("POST", "/sync", bytes.NewBuffer(reqBody))
    if err != nil {
        t.Fatal(err)
    }

    rr := httptest.NewRecorder()
    handler := http.HandlerFunc(syncHandler)

    handler.ServeHTTP(rr, req)

    if status := rr.Code; status != http.StatusOK {
        t.Errorf("handler returned wrong status code: got %v want %v",
            status, http.StatusOK)
    }

    var response SyncResponse
    err = json.NewDecoder(rr.Body).Decode(&response)
    if err != nil {
        t.Fatal(err)
    }

    expected := []string{"test1_processed", "test2_processed", "test3_processed"}
    if !equal(response.Result, expected) {
        t.Errorf("handler returned unexpected body: got %v want %v",
            response.Result, expected)
    }
}

func equal(a, b []string) bool {
    if len(a) != len(b) {
        return false
    }
    for i := range a {
        if a[i] != b[i] {
            return false
        }
    }
    return true
}
