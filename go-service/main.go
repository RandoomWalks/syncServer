package main

import (
    "encoding/json"
    "log"
    "net/http"
    "sync"
)

type SyncRequest struct {
    Data []string `json:"data"`
}

type SyncResponse struct {
    Result []string `json:"result"`
}

func processData(data []string, wg *sync.WaitGroup, resultChan chan string) {
    defer wg.Done()
    for _, d := range data {
        resultChan <- d + "_processed"
    }
}

func syncHandler(w http.ResponseWriter, r *http.Request) {
    var req SyncRequest
    err := json.NewDecoder(r.Body).Decode(&req)
    if err != nil {
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }

    var wg sync.WaitGroup
    resultChan := make(chan string, len(req.Data))
    wg.Add(len(req.Data))

    for _, data := range req.Data {
        go processData([]string{data}, &wg, resultChan)
    }

    wg.Wait()
    close(resultChan)

    var results []string
    for res := range resultChan {
        results = append(results, res)
    }

    resp := SyncResponse{Result: results}
    json.NewEncoder(w).Encode(resp)
}

func main() {
    http.HandleFunc("/sync", syncHandler)
    log.Fatal(http.ListenAndServe(":8080", nil))
}
