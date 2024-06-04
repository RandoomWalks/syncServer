package main

import (
    "log"
    "net/http"

    "go-service/handlers"
)

func main() {
    http.HandleFunc("/sync", handlers.SyncHandler)

    log.Println("Starting server on :8080")
    log.Fatal(http.ListenAndServe(":8080", nil))
}
