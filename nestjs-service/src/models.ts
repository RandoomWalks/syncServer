import { ObjectId } from 'mongodb';

export interface ReceiveClientChangesReq {
    changes: (DeleteChange | CreateChange | UpdateChange)[];
}



export type ChangeType = 'create' | 'update' | 'delete';

export interface DeleteChange {
    type: ChangeType;
    data: {
        _id: ObjectId;
    }
}

export interface UpdateChange extends DeleteChange {
    data: {
        _id: ObjectId;
        name?: string;
    }
}

export interface CreateChange extends DeleteChange {
    data: {
        _id: ObjectId;
        name?: string;
    }
}
