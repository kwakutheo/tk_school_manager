import { PaymentProvider } from '@school-saas/config';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class InitiateMobileMoneyPaymentDto {
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  amount!: number;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  @Matches(/^\+?[0-9][0-9\s-]{7,18}$/)
  payerPhoneNumber!: string;

  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

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
}
