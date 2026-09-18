import { PaymentMethod } from '@school-saas/config';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * DTO for initiating an external school-fee payment via Hubtel.
 *
 * The payment provider (HUBTEL) is fixed by the application — the client
 * does NOT choose the provider.  The client chooses the payment method
 * (mobile money, card, bank transfer, etc.) which Hubtel then routes
 * to the appropriate payment channel.
 */
export class InitiateFeePaymentDto {
  /** Amount to charge, in GHS. Must match or be less than the invoice balance. */
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  amount!: number;

  /** The payment channel the customer wishes to use. */
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  /** Customer mobile number (required for MOBILE_MONEY payments). */
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  customerPhone?: string | null;

  /** Customer email (required for CARD / redirect-based payments). */
  @IsOptional()
  @IsEmail()
  customerEmail?: string | null;

  /**
   * Optional internal reference. Scholentra generates a UUID if not provided.
   * Must be unique per payment attempt.
   */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  reference?: string | null;

  /** Optional notes attached to the payment record. */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  notes?: string | null;
}
