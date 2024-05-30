export interface IDatabaseService {
    connect(): Promise<void>;
    getDb(): Promise<any>;
    close(): Promise<void>;
    insertOne(collectionName: string, document: any): Promise<void>;
    updateOne(collectionName: string, filter: any, update: any): Promise<void>;
    deleteOne(collectionName: string, filter: any): Promise<void>;
    find(collectionName: string, query: any): Promise<any[]>;
}
