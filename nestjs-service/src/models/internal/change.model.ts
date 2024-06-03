// models/internal/change.model.ts
import { ObjectId } from 'mongodb';

export class Change {
    _id: ObjectId;
    type: 'create' | 'update' | 'delete';
    data: any;
    updatedAt: Date;
  }

  // data: {_id: new ObjectId(),  }
