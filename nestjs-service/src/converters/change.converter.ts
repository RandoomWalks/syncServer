// converters/change.converter.ts
import { Change } from '../models/internal/change.model';
import { ChangeDto } from '../models/external/change.dto';

export class ChangeConverter {
  static toInternal(changeDto: ChangeDto): Change {
    return {
      _id: changeDto.data._id, // Assuming data contains _id
      type: changeDto.type,
      data: changeDto.data,
      updatedAt: new Date()
    };
  }

  static toExternal(change: Change): ChangeDto {
    return {
      type: change.type,
      data: change.data
    };
  }
}
