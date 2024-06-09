// // converters/change.converter.ts
// import { Change } from '../models/internal/change.model';
// import { ChangeDto } from '../models/external/change.dto';

// export class ChangeConverter {
//   static toInternal(changeDto: ChangeDto): Change {
//     if (!changeDto || !changeDto.data) {
//       return undefined;
//     }
//     return {
//       _id: changeDto.data._id, // Assuming data contains _id
//       type: changeDto.type,
//       data: changeDto.data,
//       updatedAt: new Date()
//     };
//   }

//   static toExternal(change: Change): ChangeDto {
//     if (!change) {
//       //  'undefined' denotes that a variable has been declared, but hasn't been assigned any value.
//       return undefined;
//     }
//     return {
//       type: change.type,
//       data: change.data
//     };
//   }
// }

import { ChangeDto } from '../models/external/change.dto';
import { ChangeDocument } from '../models/internal/change.model';
import { Operation } from '../crdt/ot-document.model';
// import { ChangeDocument } from '../change-processor/change-processor.service'; // Ensure this path is correct

// export class ChangeConverter {
//     static toInternal(changeDto: ChangeDto): Operation {
//         if (!changeDto || !changeDto.data) {
//             return undefined;
//         }
//         return {
//             type: changeDto.type as 'insert' | 'delete',
//             position: changeDto.data.position,
//             text: changeDto.data.text,
//             length: changeDto.data.length,
//             vectorClock: changeDto.vectorClock || {},
//             clientId: changeDto.clientId,
//         };
//     }

//     static toExternal(operation: Operation): ChangeDto {
//         if (!operation) {
//             return undefined;
//         }
//         return {
//             type: operation.type,
//             data: {
//                 position: operation.position,
//                 text: operation.text,
//                 length: operation.length,
//             },
//             vectorClock: operation.vectorClock,
//             clientId: operation.clientId,
//         };
//     }
// }



export class ChangeConverter {
  static toInternal(changeDto: ChangeDto): Operation {
    return {
      type: changeDto.type,
      position: changeDto.position,
      vectorClock: changeDto.vectorClock,
      clientId: changeDto.clientId,
      ...(changeDto.text && { text: changeDto.text }),
      ...(changeDto.length && { length: changeDto.length }),
    };
  }

  static toExternal(doc: ChangeDocument): ChangeDto {
    return {
      type: doc.type,
      position: doc.position,
      vectorClock: doc.vectorClock,
      clientId: doc.clientId,
      text: doc.text,
      length: doc.length,
    };
  }
}