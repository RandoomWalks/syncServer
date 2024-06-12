### Project Documentation

#### Project Overview

**Project Name**: Microservices Architecture with NestJS and Go

**Project Description**: This project implements a microservices architecture to handle performance-critical tasks efficiently. 
The NestJS service serves as the main backend, orchestrating various modules and communicating with the Go service, which is designed to handle data processing tasks that require high concurrency and performance.

#### Service Responsibilities

- **SyncController**: Handles incoming client change requests and delegates processing to the ChangeProcessorService.
- **ChangeProcessorService**: Converts DTOs to internal operations, applies operations to the OTDocument, and writes changes to the database.
- **OTDocument**: Manages the document state and transformation operations using vector clocks.
- **DatabaseService**: Provides database connectivity and operations, including bulk writing changes.




## Sequence Diagram for Client Change Processing
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




## Class Diagram for Key Components
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



## Database Schema Diagram
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
