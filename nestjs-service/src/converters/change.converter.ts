// converters/change.converter.ts
import { Change } from '../models/internal/change.model';
import { ChangeDto } from '../models/external/change.dto';

export class ChangeConverter {
  static toInternal(changeDto: ChangeDto): Change {
    if (!changeDto || !changeDto.data) {
      return undefined;
    }
    return {
      _id: changeDto.data._id, // Assuming data contains _id
      type: changeDto.type,
      data: changeDto.data,
      updatedAt: new Date()
    };
  }

  static toExternal(change: Change): ChangeDto {
    if (!change) {
      //  'undefined' denotes that a variable has been declared, but hasn't been assigned any value.
      return undefined;
    }
    return {
      type: change.type,
      data: change.data
    };
  }
}
