package main

import (
    "context"
    "encoding/json"
    "log"
    "net/http"
    "sync"
    "os"
    "os/signal"
    "syscall"
    "time"

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

func handleGracefulShutdown(server *http.Server, timeout time.Duration, done chan bool) {
    // Create a channel to receive OS signals
    stop := make(chan os.Signal, 1)
    signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

    // Block until a signal is received
    <-stop

    log.Println("Received termination signal, initiating graceful shutdown")

    // Create a context with a timeout for the shutdown process
    ctx, cancel := context.WithTimeout(context.Background(), timeout)
    defer cancel()

    // Attempt to gracefully shutdown the server
    if err := server.Shutdown(ctx); err != nil {
        log.Fatalf("Could not gracefully shutdown the server: %v\n", err)
    }

    log.Println("Server gracefully stopped")
    close(done)
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
    // defer close(resultChan)
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
    // Create an HTTP server
    server := &http.Server{
        Addr:    ":8080",
        Handler: http.DefaultServeMux,
    }

    // Register the handler
    http.HandleFunc("/sync", handlers.SyncHandler)

    // Channel to signal the completion of shutdown
    done := make(chan bool, 1)

    // Start the server in a goroutine
    go func() {
        log.Println("Starting server on :8080")
        if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
            log.Fatalf("Could not listen on :8080: %v\n", err)
        }
    }()

    // Handle graceful shutdown
    handleGracefulShutdown(server, 5*time.Second, done)

    // Block until graceful shutdown is complete
    <-done
}


// func main() {
//     // http.HandleFunc("/sync", syncHandler)
//     http.HandleFunc("/sync", handlers.SyncHandler)

//     log.Println("Starting server on :8080")
//     log.Fatal(http.ListenAndServe(":8080", nil))
// }

