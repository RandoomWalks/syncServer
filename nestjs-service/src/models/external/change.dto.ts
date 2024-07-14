import { IsString, IsNumber, IsObject, ValidateNested, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, Validate } from 'class-validator';
import { VectorClock } from '../../crdt/ot-document.model';

@ValidatorConstraint({ name: 'vectorClock', async: false })
export class VectorClockValidator implements ValidatorConstraintInterface {
  validate(vectorClock: any, args: ValidationArguments) {
    if (typeof vectorClock !== 'object' || vectorClock === null) {
      return false;
    }
    
    return Object.entries(vectorClock).every(([key, value]) => 
      typeof key === 'string' && typeof value === 'number'
    );
  }

  defaultMessage(args: ValidationArguments) {
    return 'VectorClock must be an object with string keys and number values';
  }
}

export class VectorClockDto implements VectorClock {
  [clientId: string]: number;
}

export class ServerChangesQueryDto {
  @IsOptional()
  @IsDateString()
  since?: string;

  @IsOptional()
  @IsString()
  vectorClock?: string;
}

export class ChangeDto {
  @IsEnum(['insert', 'delete'])
  type: "insert" | "delete";

  @IsNumber()
  position: number;

  @IsObject()
  @Validate(VectorClockValidator)
  vectorClock: VectorClockDto;

  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsNumber()
  length?: number;

  @IsOptional()
  @IsDateString()
  updatedAt?: string; // ISO 8601 string
}

// import { IsString, IsNumber, IsObject, ValidateNested, IsOptional, IsDateString, IsEnum } from 'class-validator';
// import { Type } from 'class-transformer';

// class VectorClockEntry {
//   @IsString()
//   clientId: string;

//   @IsNumber()
//   timestamp: number;
// }

// export class VectorClockDto {
//   @IsObject()
//   @ValidateNested({ each: true })
//   @Type(() => VectorClockEntry)
//   entries: VectorClockEntry[];
// }

// export class ServerChangesQueryDto {
//   @IsOptional()
//   @IsDateString()
//   since?: string;

//   @IsOptional()
//   @IsString()
//   vectorClock?: string;
// }

// export class ChangeDto {
//   @IsEnum(['insert', 'delete'])
//   type: "insert" | "delete";

//   @IsNumber()
//   position: number;

//   @IsObject()
//   @ValidateNested()
//   @Type(() => VectorClockDto)
//   vectorClock: VectorClockDto;

//   @IsString()
//   clientId: string;

//   @IsOptional()
//   @IsString()
//   text?: string;

//   @IsOptional()
//   @IsNumber()
//   length?: number;

//   @IsOptional()
//   @IsDateString()
//   updatedAt?: string; // ISO 8601 string
// }
