// // converters/change.converter.ts
import { ChangeDto } from '../models/external/change.dto';
import { ChangeDocument } from '../models/internal/change.model';
import { Operation } from '../crdt/ot-document.model';

export class ChangeConverter {
  static toInternal(changeDto: ChangeDto): Operation {
    return {
      type: changeDto.type,
      position: changeDto.position,
      vectorClock: changeDto.vectorClock,
      clientId: changeDto.clientId,
      ...(changeDto.text && { text: changeDto.text }),
      ...(changeDto.length && { length: changeDto.length }),
      ...(changeDto.updatedAt && { updatedAt: changeDto.updatedAt.valueOf().toString() }),
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
      updatedAt:new Date(parseInt(doc.updatedAt)),
    };
  }
}