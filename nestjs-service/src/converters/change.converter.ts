// // converters/change.converter.ts
import { ChangeDto } from '../models/external/change.dto';
import { ChangeDocument } from '../models/internal/change.model';
import { Operation } from '../crdt/ot-document.model';

// export class ChangeConverter {

//   static toInternal(changeDto: ChangeDto): Operation {
//     // type, position, vectorClock, and clientId are directly copied from ChangeDto to Operation.
//     // For optional fields (text, length, updatedAt), the method checks if they are present in changeDto before including them in the returned object.
//     return {
//       type: changeDto.type,
//       position: changeDto.position,
//       vectorClock: changeDto.vectorClock,
//       clientId: changeDto.clientId,
//       updatedAt: changeDto.updatedAt || new Date().toISOString(),
//       ...(changeDto.text && { text: changeDto.text }),
//       ...(changeDto.length && { length: changeDto.length }),
//     };
//   }
  
//   static toDocument(operation: Operation): ChangeDocument {
//     return {
//       ...operation,
//       _id: new ObjectId(operation.clientId),
//       updatedAt: new Date(operation.updatedAt),
//     };
//   }

//   static toExternal(doc: ChangeDocument): ChangeDto {
//     return {
//       type: doc.type,
//       position: doc.position,
//       vectorClock: doc.vectorClock,
//       clientId: doc._id.toHexString(),
//       text: doc.text,
//       length: doc.length,
//       updatedAt: doc.updatedAt.toISOString(),
//     };
//   }
// }


import { ObjectId } from 'mongodb';

/**
 * Utility class for converting between internal and external representations of changes,
 * ensuring compatibility with MongoDB storage and ISO 8601 date formats.
 * 
1. Client <-> Server (API): Use ISO 8601 strings (ChangeDto)
2. Server internal logic: Use ISO 8601 strings (Operation)
3. Database interactions: Use Date objects (ChangeDocument)

 */
export class ChangeConverter {
  /**
   * Converts a ChangeDto to an Operation object for internal processing.
   * Ensures updatedAt field defaults to current timestamp in ISO 8601 format if not provided.
   * @param changeDto The ChangeDto object to convert.
   * @returns An Operation object with converted fields.
   */
  static toInternal(changeDto: ChangeDto): Operation {
    return {
      ...changeDto,
      updatedAt: changeDto.updatedAt || new Date().toISOString(), // Ensure updatedAt is in ISO 8601 format
    };
  }

  /**
   * Converts an Operation object to a ChangeDocument suitable for MongoDB storage.
   * Converts clientId to MongoDB's ObjectId and parses updatedAt to a Date object.
   * @param operation The Operation object to convert.
   * @returns A ChangeDocument object ready for MongoDB storage.
   */
  static toDocument(operation: Operation): ChangeDocument {
    return {
      ...operation,
      _id: new ObjectId(operation.clientId), // Convert clientId to MongoDB's ObjectId format
      updatedAt: new Date(operation.updatedAt), // Parse updatedAt from ISO 8601 string to Date object
    };
  }

  /**
   * Converts a ChangeDocument retrieved from MongoDB back to a ChangeDto for external representation.
   * Converts MongoDB's _id to clientId as a hexadecimal string and formats updatedAt as ISO 8601 string.
   * @param doc The ChangeDocument retrieved from MongoDB.
   * @returns A ChangeDto object representing external data format.
   */
  static toExternal(doc: ChangeDocument): ChangeDto {
    return {
      ...doc,
      clientId: doc._id.toHexString(), // Convert MongoDB's _id to clientId as hexadecimal string
      updatedAt: doc.updatedAt.toISOString(), // Format updatedAt Date object as ISO 8601 string
    };
  }
}
