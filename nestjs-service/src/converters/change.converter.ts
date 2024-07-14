// // converters/change.converter.ts
import { ChangeDto } from '../models/external/change.dto';
import { ChangeDocument } from '../models/internal/change.model';
import { Operation } from '../crdt/ot-document.model';


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
      _id:new ObjectId(), // Generate a new ObjectId for the document
      clientId: operation.clientId, // keep clientId as string
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
      clientId: doc.clientId.toString(), // Convert MongoDB's _id to clientId as hexadecimal string
      updatedAt: doc.updatedAt.toISOString(), // Format updatedAt Date object as ISO 8601 string
    };
  }
}


// ### Example: Complex Conversion Chain (`ChangeDto` to `ChangeDocument` to `ChangeDto`)

// 1. **Convert `ChangeDto` to `Operation`**:

// ```typescript
// const changeDto4: ChangeDto = {
//   type: "delete",
//   position: 15,
//   vectorClock: { "client2": 5, "client3": 2 },
//   clientId: "client2",
//   length: 7
// };

// const operation4: Operation = ChangeConverter.toInternal(changeDto4);
// console.log(operation4);
// /* Output:
// {
//   type: 'delete',
//   position: 15,
//   vectorClock: { client2: 5, client3: 2 },
//   clientId: 'client2',
//   length: 7,
//   updatedAt: '2024-07-10T12:34:56.789Z' // Assuming current timestamp
// }
// */
// ```

// 2. **Convert `Operation` to `ChangeDocument`**:

// ```typescript
// const changeDocument4: ChangeDocument = ChangeConverter.toDocument(operation4);
// console.log(changeDocument4);
// /* Output:
// {
//   _id: ObjectId("..."), // Newly generated ObjectId
//   type: 'delete',
//   position: 15,
//   vectorClock: { client2: 5, client3: 2 },
//   clientId: 'client2',
//   length: 7,
//   updatedAt: 2024-07-10T12:34:56.789Z // Date object
// }
// */
// ```

// 3. **Convert `ChangeDocument` back to `ChangeDto`**:

// ```typescript
// const changeDtoConvertedBack: ChangeDto = ChangeConverter.toExternal(changeDocument4);
// console.log(changeDtoConvertedBack);
// /* Output:
// {
//   type: 'delete',
//   position: 15,
//   vectorClock: { client2: 5, client3: 2 },
//   clientId: '...', // Hexadecimal string representation of ObjectId
//   length: 7,
//   updatedAt: '2024-07-10T12:34:56.789Z' // ISO 8601 string
// }
// */
// ```

