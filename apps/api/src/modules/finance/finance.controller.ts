import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import {
  IAuthenticatedUser,
  IFeeInvoice,
  IFeeInvoiceWithPayments,
  IFeePayment,
} from '@school-saas/types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateFeeInvoiceDto } from './dto/create-fee-invoice.dto';
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
