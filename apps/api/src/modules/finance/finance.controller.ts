import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import {
  IAuthenticatedUser,
  IFeeInvoice,
  IFeeInvoiceGenerationResult,
  IFeeInvoiceWithPayments,
  IFeePayment,
  IFinanceSummary,
} from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateFeeInvoiceDto } from './dto/create-fee-invoice.dto';
import { GenerateFeeInvoicesDto } from './dto/generate-fee-invoices.dto';
import { RecordFeePaymentDto } from './dto/record-fee-payment.dto';
import { FINANCE_ACCESS_ROLES, FinanceService } from './finance.service';

@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('invoices')
  @Roles(...FINANCE_ACCESS_ROLES)
  createInvoice(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Body() dto: CreateFeeInvoiceDto,
  ): Promise<IFeeInvoice> {
    return this.financeService.createInvoice(currentUser, dto);
  }

  @Get('invoices')
  @Roles(...FINANCE_ACCESS_ROLES)
  findInvoices(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('schoolId') schoolId?: string,
    @Query('studentId') studentId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('term') term?: string,
    @Query('status') status?: string,
  ): Promise<IFeeInvoice[]> {
    return this.financeService.findInvoices(currentUser, {
      schoolId,
      studentId,
      academicYear,
      term,
      status,
    });
  }

  @Post('invoices/generate')
  @Roles(...FINANCE_ACCESS_ROLES)
  generateInvoices(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Body() dto: GenerateFeeInvoicesDto,
  ): Promise<IFeeInvoiceGenerationResult> {
    return this.financeService.generateInvoices(currentUser, dto);
  }

  @Get('summary')
  @Roles(...FINANCE_ACCESS_ROLES)
  getSummary(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('schoolId') schoolId?: string,
    @Query('academicYear') academicYear?: string,
    @Query('term') term?: string,
    @Query('asOfDate') asOfDate?: string,
  ): Promise<IFinanceSummary> {
    return this.financeService.getSummary(currentUser, {
      schoolId,
      academicYear,
      term,
      asOfDate,
    });
  }

  @Get('invoices/:id')
  @Roles(...FINANCE_ACCESS_ROLES)
  findInvoice(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IFeeInvoiceWithPayments> {
    return this.financeService.findInvoice(currentUser, id);
  }

  @Delete('invoices/:id')
  @Roles(...FINANCE_ACCESS_ROLES)
  cancelInvoice(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IFeeInvoiceWithPayments> {
    return this.financeService.cancelInvoice(currentUser, id);
  }

  @Post('invoices/:id/payments')
  @Roles(...FINANCE_ACCESS_ROLES)
  recordPayment(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RecordFeePaymentDto,
  ): Promise<IFeePayment> {
    return this.financeService.recordPayment(currentUser, id, dto);
  }

  @Patch('payments/:id/reverse')
  @Roles(...FINANCE_ACCESS_ROLES)
  reversePayment(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Param('id') id: string,
  ): Promise<IFeePayment> {
    return this.financeService.reversePayment(currentUser, id);
  }

  @Get('payments')
  @Roles(...FINANCE_ACCESS_ROLES)
  findPayments(
    @CurrentUser() currentUser: IAuthenticatedUser,
    @Query('schoolId') schoolId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('studentId') studentId?: string,
    @Query('method') method?: string,
    @Query('status') status?: string,
  ): Promise<IFeePayment[]> {
    return this.financeService.findPayments(currentUser, {
      schoolId,
      invoiceId,
      studentId,
      method,
      status,
    });
  }
}
