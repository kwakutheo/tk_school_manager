import { PaymentMethod, PaymentStatus } from '@school-saas/config';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RecordFeePaymentDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  amount!: number;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  reference?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  notes?: string | null;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
