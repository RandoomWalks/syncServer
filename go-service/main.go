package main

import (
    "encoding/json"
    "log"
    "net/http"
    "sync"

    "go-service/handlers"
)

type SyncRequest struct {
    Data []string `json:"data"`
}

type SyncResponse struct {
    Result []string `json:"result"`
}

func processData(data string, resultChan chan string, logPrefix string) {
    processedData := data + "_processed"
    log.Printf("%sProcessed data: %s", logPrefix, processedData)
    resultChan <- processedData
}

func syncHandler(w http.ResponseWriter, r *http.Request) {
    log.Println("Received request")

    // Decode the request body
    var req SyncRequest
    err := json.NewDecoder(r.Body).Decode(&req)
    if err != nil {
        log.Printf("Error decoding request: %v", err)
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    log.Printf("Request data: %v", req.Data)

    // Prepare to process data
    var wg sync.WaitGroup
    resultChan := make(chan string, len(req.Data))
    logPrefix := "[syncHandler] "

    // Process each data item in a goroutine
    for _, data := range req.Data {
        wg.Add(1)
        go func(d string) {
            defer wg.Done()
            processData(d, resultChan, logPrefix)
        }(data)
    }

    // Wait for all goroutines to finish
    go func() {
        wg.Wait()
        close(resultChan)
    }()

    // Collect results
    var results []string
    for res := range resultChan {
        results = append(results, res)
    }
    log.Printf("Processed results: %v", results)

    // Encode and send the response
    resp := SyncResponse{Result: results}
    if err := json.NewEncoder(w).Encode(resp); err != nil {
        log.Printf("Error encoding response: %v", err)
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    log.Println("Response sent successfully")
}

func main() {
    // http.HandleFunc("/sync", syncHandler)
    http.HandleFunc("/sync", handlers.SyncHandler)

    log.Println("Starting server on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
