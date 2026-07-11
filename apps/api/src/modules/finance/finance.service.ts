import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  AcademicTerm as PrismaAcademicTerm,
  EnrollmentStatus as PrismaEnrollmentStatus,
  FeeInvoice,
  FeeInvoiceStatus as PrismaFeeInvoiceStatus,
  FeePayment,
  PaymentMethod as PrismaPaymentMethod,
  PaymentStatus as PrismaPaymentStatus,
  Prisma,
} from '@prisma/client';
import {
  ADMIN_TIER_ROLES,
  AcademicTerm,
  FeeInvoiceStatus,
  isPlatformRole,
  PaymentMethod,
  PaymentStatus,
  Role,
} from '@school-saas/config';
import {
  IAuthenticatedUser,
  IFeeInvoice,
  IFeeInvoiceGenerationResult,
  IFeeInvoiceWithPayments,
  IFeePayment,
  IFinanceSummary,
} from '@school-saas/types';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFeeInvoiceDto } from './dto/create-fee-invoice.dto';
import { GenerateFeeInvoicesDto } from './dto/generate-fee-invoices.dto';
import { RecordFeePaymentDto } from './dto/record-fee-payment.dto';

interface ListFeeInvoicesFilters {
  schoolId?: string;
  studentId?: string;
  academicYear?: string;
  term?: string;
  status?: string;
}

interface ListFeePaymentsFilters {
  schoolId?: string;
  invoiceId?: string;
  studentId?: string;
  method?: string;
  status?: string;
}

interface FinanceSummaryFilters {
  schoolId?: string;
  academicYear?: string;
  term?: string;
  asOfDate?: string;
}

interface EnrollmentScope {
  id: string;
  schoolId: string;
  studentId: string;
  academicYear: string;
  status: PrismaEnrollmentStatus;
  student: {
    schoolId: string;
    isActive: boolean;
  };
  schoolClass: {
    schoolId: string;
    isActive: boolean;
  };
}

interface ClassFinanceScope {
  schoolId: string;
  academicYear: string;
  isActive: boolean;
}

interface EnrollmentForInvoiceGeneration {
  id: string;
  studentId: string;
}

type FeeInvoiceWithPaymentsModel = FeeInvoice & {
  payments: FeePayment[];
};

type FeePaymentWithInvoiceModel = FeePayment & {
  invoice: FeeInvoiceWithPaymentsModel;
};

export const FINANCE_ACCESS_ROLES = [...ADMIN_TIER_ROLES, Role.ACCOUNTANT] as const;

@Injectable()
export class FinanceService {
  constructor(private readonly prisma: PrismaService) {}

  async createInvoice(
    currentUser: IAuthenticatedUser,
    dto: CreateFeeInvoiceDto,
  ): Promise<IFeeInvoice> {
    const schoolId = this.resolveSchoolId(currentUser, dto.schoolId);
    const academicYear = this.clean(dto.academicYear);
    const enrollment = await this.getActiveEnrollmentForInvoice(
      schoolId,
      dto.studentId,
      academicYear,
      dto.studentEnrollmentId,
    );

    try {
      const invoice = await this.prisma.feeInvoice.create({
        data: {
          schoolId,
          studentId: dto.studentId,
          studentEnrollmentId: enrollment.id,
          academicYear,
          term: dto.term as PrismaAcademicTerm,
          title: this.clean(dto.title),
          description: this.optionalClean(dto.description),
          dueDate: this.toDateOnly(dto.dueDate),
          amount: dto.amount,
          status: PrismaFeeInvoiceStatus.OPEN,
          createdById: currentUser.id,
        },
      });

      return this.toFeeInvoice(invoice);
    } catch (error) {
      this.handleKnownPrismaError(
        error,
        'A fee invoice with the same student, term, and title already exists',
      );
    }
  }

  async generateInvoices(
    currentUser: IAuthenticatedUser,
    dto: GenerateFeeInvoicesDto,
  ): Promise<IFeeInvoiceGenerationResult> {
    const schoolId = this.resolveSchoolId(currentUser, dto.schoolId);
    const academicYear = this.clean(dto.academicYear);
    const title = this.clean(dto.title);
    const schoolClass = await this.getClassScope(dto.classId);

    this.ensureClassCanReceiveInvoices(schoolClass, schoolId, academicYear);

    const enrollments = await this.prisma.studentEnrollment.findMany({
      where: {
        schoolId,
        classId: dto.classId,
        academicYear,
        status: PrismaEnrollmentStatus.ACTIVE,
        student: {
          isActive: true,
        },
      },
      select: {
        id: true,
        studentId: true,
      },
      orderBy: [{ enrolledAt: 'asc' }],
    });
    const studentIds = enrollments.map((enrollment) => enrollment.studentId);
    const existingInvoices = studentIds.length
      ? await this.prisma.feeInvoice.findMany({
          where: {
            schoolId,
            studentId: { in: studentIds },
            academicYear,
            term: dto.term as PrismaAcademicTerm,
            title,
          },
          select: {
            studentId: true,
          },
        })
      : [];
    const existingStudentIds = new Set(existingInvoices.map((invoice) => invoice.studentId));
    const invoiceTargets = enrollments.filter(
      (enrollment) => !existingStudentIds.has(enrollment.studentId),
    );

    try {
      const createdInvoices = await this.createInvoicesForEnrollments(
        invoiceTargets,
        schoolId,
        dto,
        academicYear,
        title,
        currentUser.id,
      );

      return {
        schoolId,
        classId: dto.classId,
        academicYear,
        term: dto.term,
        title,
        requestedEnrollments: enrollments.length,
        createdInvoices: createdInvoices.length,
        skippedExistingInvoices: enrollments.length - invoiceTargets.length,
        invoices: createdInvoices.map((invoice) => this.toFeeInvoice(invoice)),
      };
    } catch (error) {
      this.handleKnownPrismaError(
        error,
        'One or more fee invoices with the same student, term, and title already exist',
      );
    }
  }

  async findInvoices(
    currentUser: IAuthenticatedUser,
    filters: ListFeeInvoicesFilters = {},
  ): Promise<IFeeInvoice[]> {
    const schoolId = this.resolveSchoolId(currentUser, filters.schoolId);
    const term = this.optionalEnumValue(AcademicTerm, filters.term, 'term');
    const status = this.optionalEnumValue(FeeInvoiceStatus, filters.status, 'status');

    if (filters.studentId) {
      await this.ensureStudentInSchool(filters.studentId, schoolId);
    }

    const invoices = await this.prisma.feeInvoice.findMany({
      where: {
        schoolId,
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.academicYear ? { academicYear: this.clean(filters.academicYear) } : {}),
        ...(term ? { term: term as PrismaAcademicTerm } : {}),
        ...(status ? { status: status as PrismaFeeInvoiceStatus } : {}),
      },
      include: {
        payments: true,
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return invoices.map((invoice) => this.toFeeInvoice(invoice, invoice.payments));
  }

  async findInvoice(currentUser: IAuthenticatedUser, id: string): Promise<IFeeInvoiceWithPayments> {
    const invoice = await this.getInvoiceWithPayments(id);

    this.ensureTenantAccess(currentUser, invoice.schoolId);
    return this.toFeeInvoiceWithPayments(invoice);
  }

  async findPayments(
    currentUser: IAuthenticatedUser,
    filters: ListFeePaymentsFilters = {},
  ): Promise<IFeePayment[]> {
    const schoolId = this.resolveSchoolId(currentUser, filters.schoolId);
    const method = this.optionalEnumValue(PaymentMethod, filters.method, 'method');
    const status = this.optionalEnumValue(PaymentStatus, filters.status, 'status');

    if (filters.invoiceId) {
      await this.ensureInvoiceInSchool(filters.invoiceId, schoolId);
    }

    if (filters.studentId) {
      await this.ensureStudentInSchool(filters.studentId, schoolId);
    }

    const payments = await this.prisma.feePayment.findMany({
      where: {
        schoolId,
        ...(filters.invoiceId ? { invoiceId: filters.invoiceId } : {}),
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(method ? { method: method as PrismaPaymentMethod } : {}),
        ...(status ? { status: status as PrismaPaymentStatus } : {}),
      },
      orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
    });

    return payments.map((payment) => this.toFeePayment(payment));
  }

  async getSummary(
    currentUser: IAuthenticatedUser,
    filters: FinanceSummaryFilters = {},
  ): Promise<IFinanceSummary> {
    const schoolId = this.resolveSchoolId(currentUser, filters.schoolId);
    const term = this.optionalEnumValue(AcademicTerm, filters.term, 'term');
    const academicYear = filters.academicYear ? this.clean(filters.academicYear) : null;
    const asOfDate = this.optionalDate(filters.asOfDate) ?? new Date();

    const invoices = await this.prisma.feeInvoice.findMany({
      where: {
        schoolId,
        ...(academicYear ? { academicYear } : {}),
        ...(term ? { term: term as PrismaAcademicTerm } : {}),
      },
      include: {
        payments: true,
      },
    });

    return this.toFinanceSummary(schoolId, academicYear, term ?? null, asOfDate, invoices);
  }

  async recordPayment(
    currentUser: IAuthenticatedUser,
    invoiceId: string,
    dto: RecordFeePaymentDto,
  ): Promise<IFeePayment> {
    const invoice = await this.getInvoiceWithPayments(invoiceId);

    this.ensureTenantAccess(currentUser, invoice.schoolId);

    if (invoice.status === PrismaFeeInvoiceStatus.CANCELLED) {
      throw new BadRequestException('Cancelled invoices cannot receive payments');
    }

    const status = dto.status ?? PaymentStatus.COMPLETED;
    const amount = this.round2(dto.amount);

    if (status === PaymentStatus.COMPLETED && amount > this.invoiceBalance(invoice)) {
      throw new BadRequestException('Completed payment cannot exceed the outstanding balance');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const payment = await tx.feePayment.create({
          data: {
            schoolId: invoice.schoolId,
            invoiceId: invoice.id,
            studentId: invoice.studentId,
            studentEnrollmentId: invoice.studentEnrollmentId,
            amount,
            method: dto.method as PrismaPaymentMethod,
            status: status as PrismaPaymentStatus,
            reference: this.optionalClean(dto.reference),
            notes: this.optionalClean(dto.notes),
            paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
            recordedById: currentUser.id,
          },
        });

        if (status === PaymentStatus.COMPLETED) {
          const totalPaid = this.round2(this.completedPaymentTotal(invoice.payments) + amount);

          await tx.feeInvoice.update({
            where: { id: invoice.id },
            data: {
              status: this.invoiceStatusForPaymentTotal(Number(invoice.amount), totalPaid),
            },
          });
        }

        return this.toFeePayment(payment);
      });
    } catch (error) {
      this.handleKnownPrismaError(error, 'A payment with the same reference already exists');
    }
  }

  async reversePayment(currentUser: IAuthenticatedUser, id: string): Promise<IFeePayment> {
    const payment = await this.getPaymentWithInvoice(id);

    this.ensureTenantAccess(currentUser, payment.schoolId);

    if (payment.status === PrismaPaymentStatus.REVERSED) {
      return this.toFeePayment(payment);
    }

    if (payment.status !== PrismaPaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be reversed');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.feePayment.update({
        where: { id },
        data: { status: PrismaPaymentStatus.REVERSED },
      });
      const remainingPaid = this.completedPaymentTotal(
        payment.invoice.payments.filter((invoicePayment) => invoicePayment.id !== payment.id),
      );

      await tx.feeInvoice.update({
        where: { id: payment.invoiceId },
        data: {
          status: this.invoiceStatusForPaymentTotal(Number(payment.invoice.amount), remainingPaid),
        },
      });

      return this.toFeePayment(updatedPayment);
    });
  }

  async cancelInvoice(
    currentUser: IAuthenticatedUser,
    id: string,
  ): Promise<IFeeInvoiceWithPayments> {
    const invoice = await this.getInvoiceWithPayments(id);

    this.ensureTenantAccess(currentUser, invoice.schoolId);

    if (this.completedPaymentTotal(invoice.payments) > 0) {
      throw new BadRequestException('Invoices with completed payments cannot be cancelled');
    }

    if (invoice.status === PrismaFeeInvoiceStatus.CANCELLED) {
      return this.toFeeInvoiceWithPayments(invoice);
    }

    const updated = await this.prisma.feeInvoice.update({
      where: { id },
      data: { status: PrismaFeeInvoiceStatus.CANCELLED },
      include: {
        payments: {
          orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    return this.toFeeInvoiceWithPayments(updated);
  }

  private resolveSchoolId(currentUser: IAuthenticatedUser, requestedSchoolId?: string): string {
    if (isPlatformRole(currentUser.role)) {
      if (!requestedSchoolId) {
        throw new BadRequestException('A schoolId is required');
      }

      return requestedSchoolId;
    }

    if (!currentUser.schoolId) {
      throw new ForbiddenException('School-scoped user is missing a school context');
    }

    if (requestedSchoolId && requestedSchoolId !== currentUser.schoolId) {
      throw new ForbiddenException('You cannot access finance records outside your school');
    }

    return currentUser.schoolId;
  }

  private ensureTenantAccess(currentUser: IAuthenticatedUser, targetSchoolId: string): void {
    if (isPlatformRole(currentUser.role)) {
      return;
    }

    if (!currentUser.schoolId || currentUser.schoolId !== targetSchoolId) {
      throw new ForbiddenException('You cannot access finance records outside your school');
    }
  }

  private async getClassScope(classId: string): Promise<ClassFinanceScope> {
    const schoolClass = await this.prisma.schoolClass.findUnique({
      where: { id: classId },
      select: {
        schoolId: true,
        academicYear: true,
        isActive: true,
      },
    });

    if (!schoolClass) {
      throw new NotFoundException('Class not found');
    }

    return schoolClass;
  }

  private ensureClassCanReceiveInvoices(
    schoolClass: ClassFinanceScope,
    schoolId: string,
    academicYear: string,
  ): void {
    if (schoolClass.schoolId !== schoolId) {
      throw new ForbiddenException('You cannot generate invoices outside your school');
    }

    if (!schoolClass.isActive) {
      throw new BadRequestException('Inactive classes cannot receive generated invoices');
    }

    if (schoolClass.academicYear !== academicYear) {
      throw new BadRequestException('Class does not belong to the requested academic year');
    }
  }

  private async createInvoicesForEnrollments(
    enrollments: EnrollmentForInvoiceGeneration[],
    schoolId: string,
    dto: GenerateFeeInvoicesDto,
    academicYear: string,
    title: string,
    createdById: string,
  ): Promise<FeeInvoice[]> {
    if (!enrollments.length) {
      return [];
    }

    const description = this.optionalClean(dto.description);
    const dueDate = this.toDateOnly(dto.dueDate);

    return this.prisma.$transaction(async (tx) => {
      const createdInvoices: FeeInvoice[] = [];

      for (const enrollment of enrollments) {
        const invoice = await tx.feeInvoice.create({
          data: {
            schoolId,
            studentId: enrollment.studentId,
            studentEnrollmentId: enrollment.id,
            academicYear,
            term: dto.term as PrismaAcademicTerm,
            title,
            description,
            dueDate,
            amount: dto.amount,
            status: PrismaFeeInvoiceStatus.OPEN,
            createdById,
          },
        });

        createdInvoices.push(invoice);
      }

      return createdInvoices;
    });
  }

  private async getActiveEnrollmentForInvoice(
    schoolId: string,
    studentId: string,
    academicYear: string,
    studentEnrollmentId?: string,
  ): Promise<EnrollmentScope> {
    const enrollment = studentEnrollmentId
      ? await this.prisma.studentEnrollment.findUnique({
          where: { id: studentEnrollmentId },
          select: this.enrollmentScopeSelect(),
        })
      : await this.prisma.studentEnrollment.findFirst({
          where: {
            schoolId,
            studentId,
            academicYear,
            status: PrismaEnrollmentStatus.ACTIVE,
            student: {
              isActive: true,
            },
            schoolClass: {
              isActive: true,
            },
          },
          select: this.enrollmentScopeSelect(),
        });

    if (
      !enrollment ||
      enrollment.schoolId !== schoolId ||
      enrollment.studentId !== studentId ||
      enrollment.academicYear !== academicYear ||
      enrollment.status !== PrismaEnrollmentStatus.ACTIVE ||
      enrollment.student.schoolId !== schoolId ||
      !enrollment.student.isActive ||
      enrollment.schoolClass.schoolId !== schoolId ||
      !enrollment.schoolClass.isActive
    ) {
      throw new BadRequestException(
        'Invoice must target an active student enrollment in this school and academic year',
      );
    }

    return enrollment;
  }

  private enrollmentScopeSelect(): Prisma.StudentEnrollmentSelect {
    return {
      id: true,
      schoolId: true,
      studentId: true,
      academicYear: true,
      status: true,
      student: {
        select: {
          schoolId: true,
          isActive: true,
        },
      },
      schoolClass: {
        select: {
          schoolId: true,
          isActive: true,
        },
      },
    };
  }

  private async getInvoiceWithPayments(id: string): Promise<FeeInvoiceWithPaymentsModel> {
    const invoice = await this.prisma.feeInvoice.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Fee invoice not found');
    }

    return invoice;
  }

  private async getPaymentWithInvoice(id: string): Promise<FeePaymentWithInvoiceModel> {
    const payment = await this.prisma.feePayment.findUnique({
      where: { id },
      include: {
        invoice: {
          include: {
            payments: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Fee payment not found');
    }

    return payment;
  }

  private async ensureInvoiceInSchool(invoiceId: string, schoolId: string): Promise<void> {
    const invoice = await this.prisma.feeInvoice.findUnique({
      where: { id: invoiceId },
      select: { schoolId: true },
    });

    if (!invoice || invoice.schoolId !== schoolId) {
      throw new BadRequestException('Invoice does not exist in this school');
    }
  }

  private async ensureStudentInSchool(studentId: string, schoolId: string): Promise<void> {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      select: { schoolId: true },
    });

    if (!student || student.schoolId !== schoolId) {
      throw new BadRequestException('Student does not exist in this school');
    }
  }

  private optionalEnumValue<T extends Record<string, string>>(
    enumObject: T,
    value: string | undefined,
    fieldName: string,
  ): T[keyof T] | undefined {
    if (!value) {
      return undefined;
    }

    if (!Object.values(enumObject).includes(value)) {
      throw new BadRequestException(`Invalid finance ${fieldName}`);
    }

    return value as T[keyof T];
  }

  private clean(value: string): string {
    return value.trim();
  }

  private optionalClean(value: string | null | undefined): string | null {
    const cleaned = value?.trim();
    return cleaned ? cleaned : null;
  }

  private optionalDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Invalid finance date');
    }

    return date;
  }

  private toDateOnly(value: string): Date {
    return new Date(value);
  }

  private completedPaymentTotal(payments: FeePayment[]): number {
    return this.round2(
      payments
        .filter((payment) => payment.status === PrismaPaymentStatus.COMPLETED)
        .reduce((sum, payment) => sum + Number(payment.amount), 0),
    );
  }

  private invoiceBalance(invoice: FeeInvoiceWithPaymentsModel): number {
    return this.round2(
      Math.max(Number(invoice.amount) - this.completedPaymentTotal(invoice.payments), 0),
    );
  }

  private invoiceStatusForPaymentTotal(
    invoiceAmount: number,
    totalPaid: number,
  ): PrismaFeeInvoiceStatus {
    if (totalPaid >= invoiceAmount) {
      return PrismaFeeInvoiceStatus.PAID;
    }

    if (totalPaid > 0) {
      return PrismaFeeInvoiceStatus.PARTIALLY_PAID;
    }

    return PrismaFeeInvoiceStatus.OPEN;
  }

  private handleKnownPrismaError(error: unknown, duplicateMessage: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new BadRequestException(duplicateMessage);
    }

    throw error;
  }

  private toFeeInvoice(invoice: FeeInvoice, payments: FeePayment[] = []): IFeeInvoice {
    const amountPaid = this.completedPaymentTotal(payments);

    return {
      id: invoice.id,
      schoolId: invoice.schoolId,
      studentId: invoice.studentId,
      studentEnrollmentId: invoice.studentEnrollmentId,
      academicYear: invoice.academicYear,
      term: invoice.term as AcademicTerm,
      title: invoice.title,
      description: invoice.description,
      dueDate: invoice.dueDate,
      amount: Number(invoice.amount),
      amountPaid,
      balance: this.round2(Math.max(Number(invoice.amount) - amountPaid, 0)),
      status: invoice.status as FeeInvoiceStatus,
      createdById: invoice.createdById,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  private toFeeInvoiceWithPayments(invoice: FeeInvoiceWithPaymentsModel): IFeeInvoiceWithPayments {
    return {
      ...this.toFeeInvoice(invoice, invoice.payments),
      payments: invoice.payments.map((payment) => this.toFeePayment(payment)),
    };
  }

  private toFinanceSummary(
    schoolId: string,
    academicYear: string | null,
    term: AcademicTerm | null,
    asOfDate: Date,
    invoices: FeeInvoiceWithPaymentsModel[],
  ): IFinanceSummary {
    const activeInvoices = invoices.filter(
      (invoice) => invoice.status !== PrismaFeeInvoiceStatus.CANCELLED,
    );
    const invoiceBalances = activeInvoices.map((invoice) => ({
      invoice,
      amountPaid: this.completedPaymentTotal(invoice.payments),
      balance: this.invoiceBalance(invoice),
    }));

    return {
      schoolId,
      academicYear,
      term,
      asOfDate,
      totals: {
        invoices: invoices.length,
        openInvoices: this.countInvoicesByStatus(invoices, PrismaFeeInvoiceStatus.OPEN),
        partiallyPaidInvoices: this.countInvoicesByStatus(
          invoices,
          PrismaFeeInvoiceStatus.PARTIALLY_PAID,
        ),
        paidInvoices: this.countInvoicesByStatus(invoices, PrismaFeeInvoiceStatus.PAID),
        cancelledInvoices: this.countInvoicesByStatus(invoices, PrismaFeeInvoiceStatus.CANCELLED),
        totalInvoiced: this.round2(
          activeInvoices.reduce((sum, invoice) => sum + Number(invoice.amount), 0),
        ),
        totalPaid: this.round2(
          invoiceBalances.reduce((sum, invoiceBalance) => sum + invoiceBalance.amountPaid, 0),
        ),
        outstandingBalance: this.round2(
          invoiceBalances.reduce((sum, invoiceBalance) => sum + invoiceBalance.balance, 0),
        ),
        overdueBalance: this.round2(
          invoiceBalances
            .filter(
              ({ invoice, balance }) =>
                balance > 0 &&
                invoice.status !== PrismaFeeInvoiceStatus.PAID &&
                invoice.dueDate.getTime() < asOfDate.getTime(),
            )
            .reduce((sum, invoiceBalance) => sum + invoiceBalance.balance, 0),
        ),
      },
    };
  }

  private countInvoicesByStatus(invoices: FeeInvoice[], status: PrismaFeeInvoiceStatus): number {
    return invoices.filter((invoice) => invoice.status === status).length;
  }

  private toFeePayment(payment: FeePayment): IFeePayment {
    return {
      id: payment.id,
      schoolId: payment.schoolId,
      invoiceId: payment.invoiceId,
      studentId: payment.studentId,
      studentEnrollmentId: payment.studentEnrollmentId,
      amount: Number(payment.amount),
      method: payment.method as PaymentMethod,
      status: payment.status as PaymentStatus,
      reference: payment.reference,
      notes: payment.notes,
      paidAt: payment.paidAt,
      recordedById: payment.recordedById,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
