// models/external/change.dto.ts
export class ChangeDto {
    type: 'create' | 'update' | 'delete';
    data: any;
  }
  