import { ChangeConverter } from './change.converter';
import { ChangeDto } from '../models/external/change.dto';
import { Change } from '../models/internal/change.model';
import { ObjectId } from 'mongodb';

describe('ChangeConverter', () => {
  it('should convert ChangeDto to Change', () => {
    const changeDto: ChangeDto = {
      type: 'create',
      data: { _id: 'some-id', value: 'some data' },
    };
    const change: Change = ChangeConverter.toInternal(changeDto);

    expect(change.type).toBe(changeDto.type);
    expect(change.data).toBe(changeDto.data);
    expect(change.updatedAt).toBeInstanceOf(Date);
  });

  it('should convert Change to ChangeDto', () => {
    const change: Change = {
      _id: new ObjectId(),
      type: 'update',
      data: { value: 'some data' },
      updatedAt: new Date(),
    };
    const changeDto: ChangeDto = ChangeConverter.toExternal(change);

    expect(changeDto.type).toBe(change.type);
    expect(changeDto.data).toBe(change.data);
  });

  it('should handle missing data in ChangeDto', () => {
    const changeDto: ChangeDto = {
      type: 'delete',
      data: null,
    };
    const change: Change = ChangeConverter.toInternal(changeDto);

    expect(change).toBeUndefined();
  });

  it('should handle missing fields in Change', () => {
    const change: Change = {
      _id: new ObjectId(),
      type: 'create',
      data: null,
      updatedAt: new Date(),
    };
    const changeDto: ChangeDto = ChangeConverter.toExternal(change);

    expect(changeDto.data).toBeNull();
  });

  it('should handle undefined ChangeDto', () => {
    const changeDto: ChangeDto = undefined;
    const change: Change = ChangeConverter.toInternal(changeDto);

    expect(change).toBeUndefined();
  });

  it('should handle undefined Change', () => {
    const change: Change = undefined;
    const changeDto: ChangeDto = ChangeConverter.toExternal(change);

    expect(changeDto).toBeUndefined();
  });
});
