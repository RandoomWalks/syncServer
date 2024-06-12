### Project Documentation

#### Project Overview

**Project Name**: Microservices Architecture with NestJS and Go

**Project Description**: This project implements a microservices architecture to handle performance-critical tasks efficiently. 
The NestJS service serves as the main backend, orchestrating various modules and communicating with the Go service, which is designed to handle data processing tasks that require high concurrency and performance.

### Key Components

1. **OTDocument Class**:
   - **Purpose**: Manages the document state and applies operations using OT and vector clocks.
   - **Implementation**: Contains methods for applying, transforming, and managing operations.

2. **ChangeProcessorService**:
   - **Purpose**: Processes client changes, applies them to the OTDocument, and updates the database.
   - **Implementation**: Converts change DTOs to internal operations, applies them, and uses bulk operations for database updates.

3. **DatabaseService**:
   - **Purpose**: Manages database connections and operations.
   - **Implementation**: Provides methods for getting database instances and performing bulk writes.

4. **SyncController**:
   - **Purpose**: Handles HTTP requests for syncing data between clients and the server.
   - **Implementation**: Exposes endpoints for receiving client changes and sending server changes, integrating with ChangeProcessorService and GoClientService.

### Algorithms and Data Structures

1. **Operational Transform (OT)**:
   - **Algorithm**: Ensures that all clients can concurrently edit a document, and all edits are consistently applied in all replicas.
   - **Data Structure**: Maintains a log of operations and their vector clocks to apply transformations correctly.

2. **Vector Clocks**:
   - **Algorithm**: Tracks the version of each client's document state to determine the causality of operations.
   - **Data Structure**: A map where keys are client IDs and values are timestamps, allowing for comparison and merging of different states.

3. **Bulk Database Operations**:
   - **Algorithm**: Uses bulk write operations to efficiently process multiple database updates in a single transaction.
   - **Data Structure**: An array of operations that are executed together to minimize database interaction overhead.

   
### Sequence Diagram for Client Change Processing

```
Client                   SyncController               ChangeProcessorService          OTDocument                DatabaseService
   |                           |                                |                          |                           |
   |-- sendChanges() ---------->                                |                          |                           |
   |                           |-- receiveClientChanges() ------>                          |                           |
   |                           |                                |                          |                           |
   |                           |                                |-- processClientChanges() -->                          |
   |                           |                                |                          |                           |
   |                           |                                |                          |-- applyOperation() ------->
   |                           |                                |                          |                           |
   |                           |                                |                          |<-- updateDocument() -------|
   |                           |                                |                          |                           |
   |                           |                                |-- bulkWrite() ---------> |                           |
   |                           |                                |                          |                           |
   |                           |                                |<-- changesPersisted() ---|                           |
   |                           |                                |                          |                           |
   |<-- response --------------|                                |                          |                           |
```


### Class Diagram for Key Components

```
+-----------------------------+
| OTDocument                  |
|-----------------------------|
| - doc: string               |
| - operations: Operation[]   |
|-----------------------------|
| + applyOperation(op: Operation) : void     |
| + getDocument(): string                    |
| + transformOperation(op: Operation): Operation |
| + transformAgainst(op: Operation, againstOp: Operation): Operation |
+-----------------------------+

+-----------------------------+
| ChangeProcessorService      |
|-----------------------------|
| - otDocument: OTDocument    |
|-----------------------------|
| + processClientChanges(changes: ChangeDto[]): Promise<void> |
| + getServerChanges(since: Date): Promise<ChangeDto[]>      |
+-----------------------------+

+-----------------------------+
| DatabaseService             |
|-----------------------------|
| + getDb(): Promise<Db>      |
| + bulkWrite(ops: any[]): Promise<void> |
+-----------------------------+

+-----------------------------+
| ChangeConverter             |
|-----------------------------|
| + toInternal(dto: ChangeDto): Operation |
| + toExternal(op: Operation): ChangeDto  |
+-----------------------------+

+-----------------------------+
| SyncController              |
|-----------------------------|
| + receiveClientChanges(changes: ChangeDto[]): Promise<any> |
| + sendServerChanges(since: string): Promise<ChangeDto[]>   |
| + processData(body: { data: ChangeDto[] }): Promise<any>   |
+-----------------------------+
```

### Database Schema Diagram

```
+---------------------------+
|       client-changes      |
|---------------------------|
| _id: ObjectId             |
| type: string              |
| position: number          |
| text: string              |
| length: number            |
| vectorClock: object       |
| clientId: string          |
| updatedAt: Date           |
+---------------------------+
```