import { BadRequestException, ForbiddenException } from '@nestjs/common';
import {
  AcademicTerm as PrismaAcademicTerm,
  EnrollmentStatus as PrismaEnrollmentStatus,
  FeeInvoiceStatus as PrismaFeeInvoiceStatus,
  PaymentMethod as PrismaPaymentMethod,
  PaymentStatus as PrismaPaymentStatus,
  Prisma,
} from '@prisma/client';
import {
  AcademicTerm,
  FeeInvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  Role,
} from '@school-saas/config';
import { IAuthenticatedUser } from '@school-saas/types';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { PrismaService } from '../../prisma/prisma.service';
import { FinanceService } from './finance.service';

const SCHOOL_A = '00000000-0000-0000-0000-000000000010';
const SCHOOL_B = '00000000-0000-0000-0000-000000000020';
const ACCOUNTANT_ID = '00000000-0000-0000-0000-000000000030';
const ADMIN_ID = '00000000-0000-0000-0000-000000000031';
const STUDENT_ID = '00000000-0000-0000-0000-000000000040';
const STUDENT_B_ID = '00000000-0000-0000-0000-000000000041';
const ENROLLMENT_ID = '00000000-0000-0000-0000-000000000050';
const ENROLLMENT_B_ID = '00000000-0000-0000-0000-000000000051';
const INVOICE_ID = '00000000-0000-0000-0000-000000000060';
const INVOICE_B_ID = '00000000-0000-0000-0000-000000000061';
const PAYMENT_ID = '00000000-0000-0000-0000-000000000070';
const CLASS_ID = '00000000-0000-0000-0000-000000000080';
const ACADEMIC_YEAR = '2026/2027';

function createEnrollment(overrides: Record<string, unknown> = {}) {
  return {
    id: ENROLLMENT_ID,
    schoolId: SCHOOL_A,
    studentId: STUDENT_ID,
    academicYear: ACADEMIC_YEAR,
    status: PrismaEnrollmentStatus.ACTIVE,
    student: {
      schoolId: SCHOOL_A,
      isActive: true,
    },
    schoolClass: {
      schoolId: SCHOOL_A,
      isActive: true,
    },
    ...overrides,
  };
}

function createClassScope(overrides: Record<string, unknown> = {}) {
  return {
    schoolId: SCHOOL_A,
    academicYear: ACADEMIC_YEAR,
    isActive: true,
    ...overrides,
  };
}

function createInvoice(overrides: Record<string, unknown> = {}) {
  return {
    id: INVOICE_ID,
    schoolId: SCHOOL_A,
    studentId: STUDENT_ID,
    studentEnrollmentId: ENROLLMENT_ID,
    academicYear: ACADEMIC_YEAR,
    term: PrismaAcademicTerm.FIRST_TERM,
    title: 'Tuition',
    description: null,
    dueDate: new Date('2026-09-01T00:00:00.000Z'),
    amount: new Prisma.Decimal(1000),
    status: PrismaFeeInvoiceStatus.OPEN,
    createdById: ACCOUNTANT_ID,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createPayment(overrides: Record<string, unknown> = {}) {
  return {
    id: PAYMENT_ID,
    schoolId: SCHOOL_A,
    invoiceId: INVOICE_ID,
    studentId: STUDENT_ID,
    studentEnrollmentId: ENROLLMENT_ID,
    amount: new Prisma.Decimal(250),
    method: PrismaPaymentMethod.MOBILE_MONEY,
    status: PrismaPaymentStatus.COMPLETED,
    reference: 'MOMO-001',
    notes: null,
    paidAt: new Date('2026-09-05T00:00:00.000Z'),
    recordedById: ACCOUNTANT_ID,
    createdAt: new Date('2026-09-05T00:00:00.000Z'),
    updatedAt: new Date('2026-09-05T00:00:00.000Z'),
    ...overrides,
  };
}

function createInvoiceWithPayments(
  invoiceOverrides: Record<string, unknown> = {},
  payments = [] as ReturnType<typeof createPayment>[],
) {
  return {
    ...createInvoice(invoiceOverrides),
    payments,
  };
}

function createPaymentWithInvoice(
  paymentOverrides: Record<string, unknown> = {},
  invoiceOverrides: Record<string, unknown> = {},
  invoicePayments?: ReturnType<typeof createPayment>[],
) {
  const payment = createPayment(paymentOverrides);

  return {
    ...payment,
    invoice: createInvoiceWithPayments(invoiceOverrides, invoicePayments ?? [payment]),
  };
}

function createPrismaMock() {
  const prisma: any = {
    schoolClass: {
      findUnique: jest.fn(),
    },
    studentEnrollment: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    studentProfile: {
      findUnique: jest.fn(),
    },
    feeInvoice: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    feePayment: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  prisma.$transaction.mockImplementation(
    async (callback: (tx: typeof prisma) => Promise<unknown>) => callback(prisma),
  );

  return prisma;
}

describe('FinanceService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: FinanceService;

  const accountant: IAuthenticatedUser = {
    id: ACCOUNTANT_ID,
    email: 'accountant@school.test',
    role: Role.ACCOUNTANT,
    schoolId: SCHOOL_A,
  };

  const schoolAdmin: IAuthenticatedUser = {
    id: ADMIN_ID,
    email: 'admin@school.test',
    role: Role.SCHOOL_ADMIN,
    schoolId: SCHOOL_A,
  };

  const superAdmin: IAuthenticatedUser = {
    id: ADMIN_ID,
    email: 'super@platform.test',
    role: Role.SUPER_ADMIN,
    schoolId: null,
  };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new FinanceService(prisma as unknown as PrismaService);
  });

  it('creates a fee invoice for an active student enrollment', async () => {
    prisma.studentEnrollment.findFirst.mockResolvedValue(createEnrollment());
    prisma.feeInvoice.create.mockResolvedValue(createInvoice({ amount: new Prisma.Decimal(1500) }));

    const invoice = await service.createInvoice(accountant, {
      studentId: STUDENT_ID,
      academicYear: ` ${ACADEMIC_YEAR} `,
      term: AcademicTerm.FIRST_TERM,
      title: ' Tuition ',
      dueDate: '2026-09-01',
      amount: 1500,
    });

    expect(invoice).toEqual(
      expect.objectContaining({
        id: INVOICE_ID,
        amount: 1500,
        amountPaid: 0,
        balance: 1500,
        status: FeeInvoiceStatus.OPEN,
      }),
    );
    expect(prisma.feeInvoice.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_A,
        studentId: STUDENT_ID,
        studentEnrollmentId: ENROLLMENT_ID,
        academicYear: ACADEMIC_YEAR,
        term: PrismaAcademicTerm.FIRST_TERM,
        title: 'Tuition',
        description: null,
        dueDate: new Date('2026-09-01'),
        amount: 1500,
        status: PrismaFeeInvoiceStatus.OPEN,
        createdById: ACCOUNTANT_ID,
      },
    });
  });

  it('requires platform users to provide a school when creating invoices', async () => {
    await expect(
      service.createInvoice(superAdmin, {
        studentId: STUDENT_ID,
        academicYear: ACADEMIC_YEAR,
        term: AcademicTerm.FIRST_TERM,
        title: 'Tuition',
        dueDate: '2026-09-01',
        amount: 1000,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.studentEnrollment.findFirst).not.toHaveBeenCalled();
  });

  it('rejects invoice amounts with more than two decimal places before querying enrollments', async () => {
    await expect(
      service.createInvoice(accountant, {
        studentId: STUDENT_ID,
        academicYear: ACADEMIC_YEAR,
        term: AcademicTerm.FIRST_TERM,
        title: 'Tuition',
        dueDate: '2026-09-01',
        amount: 1000.005,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.studentEnrollment.findFirst).not.toHaveBeenCalled();
    expect(prisma.feeInvoice.create).not.toHaveBeenCalled();
  });

  it('rejects invalid invoice due dates before querying enrollments', async () => {
    await expect(
      service.createInvoice(accountant, {
        studentId: STUDENT_ID,
        academicYear: ACADEMIC_YEAR,
        term: AcademicTerm.FIRST_TERM,
        title: 'Tuition',
        dueDate: 'not-a-date',
        amount: 1000,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.studentEnrollment.findFirst).not.toHaveBeenCalled();
    expect(prisma.feeInvoice.create).not.toHaveBeenCalled();
  });

  it('generates class invoices for active enrollments and skips existing invoices', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());
    prisma.studentEnrollment.findMany.mockResolvedValue([
      {
        id: ENROLLMENT_ID,
        studentId: STUDENT_ID,
      },
      {
        id: ENROLLMENT_B_ID,
        studentId: STUDENT_B_ID,
      },
    ]);
    prisma.feeInvoice.findMany.mockResolvedValue([{ studentId: STUDENT_ID }]);
    prisma.feeInvoice.create.mockResolvedValue(
      createInvoice({
        id: INVOICE_B_ID,
        studentId: STUDENT_B_ID,
        studentEnrollmentId: ENROLLMENT_B_ID,
        title: 'PTA Dues',
        amount: new Prisma.Decimal(250),
      }),
    );

    const result = await service.generateInvoices(accountant, {
      classId: CLASS_ID,
      academicYear: ` ${ACADEMIC_YEAR} `,
      term: AcademicTerm.FIRST_TERM,
      title: ' PTA Dues ',
      dueDate: '2026-09-30',
      amount: 250,
    });

    expect(result).toEqual({
      schoolId: SCHOOL_A,
      classId: CLASS_ID,
      academicYear: ACADEMIC_YEAR,
      term: AcademicTerm.FIRST_TERM,
      title: 'PTA Dues',
      requestedEnrollments: 2,
      createdInvoices: 1,
      skippedExistingInvoices: 1,
      invoices: [
        expect.objectContaining({
          id: INVOICE_B_ID,
          studentId: STUDENT_B_ID,
          studentEnrollmentId: ENROLLMENT_B_ID,
          amount: 250,
          balance: 250,
        }),
      ],
    });
    expect(prisma.studentEnrollment.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        classId: CLASS_ID,
        academicYear: ACADEMIC_YEAR,
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
    expect(prisma.feeInvoice.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        studentId: { in: [STUDENT_ID, STUDENT_B_ID] },
        academicYear: ACADEMIC_YEAR,
        term: PrismaAcademicTerm.FIRST_TERM,
        title: 'PTA Dues',
      },
      select: {
        studentId: true,
      },
    });
    expect(prisma.feeInvoice.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_A,
        studentId: STUDENT_B_ID,
        studentEnrollmentId: ENROLLMENT_B_ID,
        academicYear: ACADEMIC_YEAR,
        term: PrismaAcademicTerm.FIRST_TERM,
        title: 'PTA Dues',
        description: null,
        dueDate: new Date('2026-09-30'),
        amount: 250,
        status: PrismaFeeInvoiceStatus.OPEN,
        createdById: ACCOUNTANT_ID,
      },
    });
  });

  it('returns an empty generation result when a class has no active enrollments', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());
    prisma.studentEnrollment.findMany.mockResolvedValue([]);

    const result = await service.generateInvoices(accountant, {
      classId: CLASS_ID,
      academicYear: ACADEMIC_YEAR,
      term: AcademicTerm.FIRST_TERM,
      title: 'PTA Dues',
      dueDate: '2026-09-30',
      amount: 250,
    });

    expect(result).toEqual({
      schoolId: SCHOOL_A,
      classId: CLASS_ID,
      academicYear: ACADEMIC_YEAR,
      term: AcademicTerm.FIRST_TERM,
      title: 'PTA Dues',
      requestedEnrollments: 0,
      createdInvoices: 0,
      skippedExistingInvoices: 0,
      invoices: [],
    });
    expect(prisma.feeInvoice.findMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('blocks class invoice generation outside the current school', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope({ schoolId: SCHOOL_B }));

    await expect(
      service.generateInvoices(accountant, {
        classId: CLASS_ID,
        academicYear: ACADEMIC_YEAR,
        term: AcademicTerm.FIRST_TERM,
        title: 'PTA Dues',
        dueDate: '2026-09-30',
        amount: 250,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prisma.studentEnrollment.findMany).not.toHaveBeenCalled();
  });

  it('rejects class invoice generation for the wrong academic year', async () => {
    prisma.schoolClass.findUnique.mockResolvedValue(createClassScope());

    await expect(
      service.generateInvoices(accountant, {
        classId: CLASS_ID,
        academicYear: '2027/2028',
        term: AcademicTerm.FIRST_TERM,
        title: 'PTA Dues',
        dueDate: '2026-09-30',
        amount: 250,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.studentEnrollment.findMany).not.toHaveBeenCalled();
  });

  it('rejects invoice creation without an active enrollment in the school year', async () => {
    prisma.studentEnrollment.findFirst.mockResolvedValue(null);

    await expect(
      service.createInvoice(accountant, {
        studentId: STUDENT_ID,
        academicYear: ACADEMIC_YEAR,
        term: AcademicTerm.FIRST_TERM,
        title: 'Tuition',
        dueDate: '2026-09-01',
        amount: 1000,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.feeInvoice.create).not.toHaveBeenCalled();
  });

  it('blocks school-scoped users from another school finance scope', async () => {
    await expect(service.findInvoices(accountant, { schoolId: SCHOOL_B })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('lists invoices with completed-payment balances', async () => {
    prisma.feeInvoice.findMany.mockResolvedValue([
      createInvoiceWithPayments({}, [
        createPayment({ amount: new Prisma.Decimal(200), status: PrismaPaymentStatus.COMPLETED }),
        createPayment({
          id: '00000000-0000-0000-0000-000000000071',
          amount: new Prisma.Decimal(50),
          status: PrismaPaymentStatus.PENDING,
        }),
      ]),
    ]);

    const invoices = await service.findInvoices(schoolAdmin, {
      academicYear: ACADEMIC_YEAR,
      term: AcademicTerm.FIRST_TERM,
      status: FeeInvoiceStatus.OPEN,
    });

    expect(invoices[0]).toEqual(
      expect.objectContaining({
        amount: 1000,
        amountPaid: 200,
        balance: 800,
      }),
    );
    expect(prisma.feeInvoice.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        academicYear: ACADEMIC_YEAR,
        term: PrismaAcademicTerm.FIRST_TERM,
        status: PrismaFeeInvoiceStatus.OPEN,
      },
      include: {
        payments: true,
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
  });

  it('builds a finance summary from invoice and completed-payment totals', async () => {
    prisma.feeInvoice.findMany.mockResolvedValue([
      createInvoiceWithPayments(
        {
          status: PrismaFeeInvoiceStatus.OPEN,
          amount: new Prisma.Decimal(1000),
          dueDate: new Date('2026-09-01T00:00:00.000Z'),
        },
        [],
      ),
      createInvoiceWithPayments(
        {
          id: '00000000-0000-0000-0000-000000000061',
          status: PrismaFeeInvoiceStatus.PARTIALLY_PAID,
          amount: new Prisma.Decimal(500),
          dueDate: new Date('2026-11-01T00:00:00.000Z'),
        },
        [
          createPayment({
            id: '00000000-0000-0000-0000-000000000071',
            amount: new Prisma.Decimal(200),
            status: PrismaPaymentStatus.COMPLETED,
          }),
          createPayment({
            id: '00000000-0000-0000-0000-000000000072',
            amount: new Prisma.Decimal(25),
            status: PrismaPaymentStatus.PENDING,
          }),
        ],
      ),
      createInvoiceWithPayments(
        {
          id: '00000000-0000-0000-0000-000000000062',
          status: PrismaFeeInvoiceStatus.PAID,
          amount: new Prisma.Decimal(300),
          dueDate: new Date('2026-08-01T00:00:00.000Z'),
        },
        [
          createPayment({
            id: '00000000-0000-0000-0000-000000000073',
            amount: new Prisma.Decimal(300),
            status: PrismaPaymentStatus.COMPLETED,
          }),
        ],
      ),
      createInvoiceWithPayments(
        {
          id: '00000000-0000-0000-0000-000000000063',
          status: PrismaFeeInvoiceStatus.CANCELLED,
          amount: new Prisma.Decimal(800),
          dueDate: new Date('2026-08-01T00:00:00.000Z'),
        },
        [
          createPayment({
            id: '00000000-0000-0000-0000-000000000074',
            amount: new Prisma.Decimal(800),
            status: PrismaPaymentStatus.COMPLETED,
          }),
        ],
      ),
    ]);

    const summary = await service.getSummary(schoolAdmin, {
      academicYear: ` ${ACADEMIC_YEAR} `,
      term: AcademicTerm.FIRST_TERM,
      asOfDate: '2026-10-01T00:00:00.000Z',
    });

    expect(summary).toEqual({
      schoolId: SCHOOL_A,
      academicYear: ACADEMIC_YEAR,
      term: AcademicTerm.FIRST_TERM,
      asOfDate: new Date('2026-10-01T00:00:00.000Z'),
      totals: {
        invoices: 4,
        openInvoices: 1,
        partiallyPaidInvoices: 1,
        paidInvoices: 1,
        cancelledInvoices: 1,
        totalInvoiced: 1800,
        totalPaid: 500,
        outstandingBalance: 1300,
        overdueBalance: 1000,
      },
    });
    expect(prisma.feeInvoice.findMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL_A,
        academicYear: ACADEMIC_YEAR,
        term: PrismaAcademicTerm.FIRST_TERM,
      },
      include: {
        payments: true,
      },
    });
  });

  it('rejects invalid summary dates before querying finance records', async () => {
    await expect(
      service.getSummary(schoolAdmin, {
        academicYear: ACADEMIC_YEAR,
        asOfDate: 'not-a-date',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.feeInvoice.findMany).not.toHaveBeenCalled();
  });

  it('records a completed payment and marks the invoice partially paid', async () => {
    prisma.feeInvoice.findUnique.mockResolvedValue(createInvoiceWithPayments());
    prisma.feePayment.create.mockResolvedValue(createPayment({ amount: new Prisma.Decimal(400) }));
    prisma.feeInvoice.update.mockResolvedValue(
      createInvoice({ status: PrismaFeeInvoiceStatus.PARTIALLY_PAID }),
    );

    const payment = await service.recordPayment(accountant, INVOICE_ID, {
      amount: 400,
      method: PaymentMethod.MOBILE_MONEY,
      reference: ' MOMO-001 ',
      paidAt: '2026-09-05T10:00:00.000Z',
    });

    expect(payment).toEqual(
      expect.objectContaining({
        id: PAYMENT_ID,
        amount: 400,
        method: PaymentMethod.MOBILE_MONEY,
      }),
    );
    expect(prisma.feePayment.create).toHaveBeenCalledWith({
      data: {
        schoolId: SCHOOL_A,
        invoiceId: INVOICE_ID,
        studentId: STUDENT_ID,
        studentEnrollmentId: ENROLLMENT_ID,
        amount: 400,
        method: PrismaPaymentMethod.MOBILE_MONEY,
        status: PrismaPaymentStatus.COMPLETED,
        reference: 'MOMO-001',
        notes: null,
        paidAt: new Date('2026-09-05T10:00:00.000Z'),
        recordedById: ACCOUNTANT_ID,
      },
    });
    expect(prisma.feeInvoice.update).toHaveBeenCalledWith({
      where: { id: INVOICE_ID },
      data: {
        status: PrismaFeeInvoiceStatus.PARTIALLY_PAID,
      },
    });
  });

  it('rejects new payments recorded directly as reversed', async () => {
    await expect(
      service.recordPayment(accountant, INVOICE_ID, {
        amount: 100,
        method: PaymentMethod.CASH,
        status: PaymentStatus.REVERSED,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.feeInvoice.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects invalid payment dates before loading the invoice', async () => {
    await expect(
      service.recordPayment(accountant, INVOICE_ID, {
        amount: 100,
        method: PaymentMethod.CASH,
        paidAt: 'not-a-date',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.feeInvoice.findUnique).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects stale completed overpayments inside the payment transaction', async () => {
    prisma.feeInvoice.findUnique
      .mockResolvedValueOnce(
        createInvoiceWithPayments({}, [
          createPayment({
            id: '00000000-0000-0000-0000-000000000071',
            amount: new Prisma.Decimal(800),
            status: PrismaPaymentStatus.COMPLETED,
          }),
        ]),
      )
      .mockResolvedValueOnce(
        createInvoiceWithPayments({}, [
          createPayment({
            id: '00000000-0000-0000-0000-000000000071',
            amount: new Prisma.Decimal(950),
            status: PrismaPaymentStatus.COMPLETED,
          }),
        ]),
      );

    await expect(
      service.recordPayment(accountant, INVOICE_ID, {
        amount: 100,
        method: PaymentMethod.CASH,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    expect(prisma.feePayment.create).not.toHaveBeenCalled();
    expect(prisma.feeInvoice.update).not.toHaveBeenCalled();
  });

  it('prevents completed overpayments', async () => {
    prisma.feeInvoice.findUnique.mockResolvedValue(
      createInvoiceWithPayments({}, [
        createPayment({ amount: new Prisma.Decimal(900), status: PrismaPaymentStatus.COMPLETED }),
      ]),
    );

    await expect(
      service.recordPayment(accountant, INVOICE_ID, {
        amount: 200,
        method: PaymentMethod.CASH,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('reverses completed payments and recalculates the invoice status', async () => {
    const reversedPayment = createPayment({
      amount: new Prisma.Decimal(600),
      status: PrismaPaymentStatus.REVERSED,
    });
    const targetPayment = createPayment({ amount: new Prisma.Decimal(600) });
    const otherPayment = createPayment({
      id: '00000000-0000-0000-0000-000000000071',
      amount: new Prisma.Decimal(300),
    });

    prisma.feePayment.findUnique.mockResolvedValue(
      createPaymentWithInvoice({ amount: new Prisma.Decimal(600) }, {}, [
        targetPayment,
        otherPayment,
      ]),
    );
    prisma.feePayment.update.mockResolvedValue(reversedPayment);
    prisma.feeInvoice.update.mockResolvedValue(
      createInvoice({ status: PrismaFeeInvoiceStatus.PARTIALLY_PAID }),
    );

    const payment = await service.reversePayment(accountant, PAYMENT_ID);

    expect(payment).toEqual(
      expect.objectContaining({
        id: PAYMENT_ID,
        amount: 600,
        status: PaymentStatus.REVERSED,
      }),
    );
    expect(prisma.feePayment.update).toHaveBeenCalledWith({
      where: { id: PAYMENT_ID },
      data: { status: PrismaPaymentStatus.REVERSED },
    });
    expect(prisma.feeInvoice.update).toHaveBeenCalledWith({
      where: { id: INVOICE_ID },
      data: {
        status: PrismaFeeInvoiceStatus.PARTIALLY_PAID,
      },
    });
  });

  it('returns already reversed payments without changing invoice state again', async () => {
    prisma.feePayment.findUnique.mockResolvedValue(
      createPaymentWithInvoice({ status: PrismaPaymentStatus.REVERSED }),
    );

    const payment = await service.reversePayment(accountant, PAYMENT_ID);

    expect(payment.status).toBe(PaymentStatus.REVERSED);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.feeInvoice.update).not.toHaveBeenCalled();
  });

  it('rejects reversal for payments that are not completed', async () => {
    prisma.feePayment.findUnique.mockResolvedValue(
      createPaymentWithInvoice({ status: PrismaPaymentStatus.PENDING }),
    );

    await expect(service.reversePayment(accountant, PAYMENT_ID)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('blocks payment reversal outside the current school', async () => {
    prisma.feePayment.findUnique.mockResolvedValue(
      createPaymentWithInvoice({ schoolId: SCHOOL_B }, { schoolId: SCHOOL_B }),
    );

    await expect(service.reversePayment(accountant, PAYMENT_ID)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('cancels invoices that do not have completed payments', async () => {
    prisma.feeInvoice.findUnique.mockResolvedValue(
      createInvoiceWithPayments({}, [
        createPayment({ status: PrismaPaymentStatus.PENDING, amount: new Prisma.Decimal(100) }),
      ]),
    );
    prisma.feeInvoice.update.mockResolvedValue(
      createInvoiceWithPayments({ status: PrismaFeeInvoiceStatus.CANCELLED }, [
        createPayment({ status: PrismaPaymentStatus.PENDING, amount: new Prisma.Decimal(100) }),
      ]),
    );

    const invoice = await service.cancelInvoice(accountant, INVOICE_ID);

    expect(invoice.status).toBe(FeeInvoiceStatus.CANCELLED);
    expect(prisma.feeInvoice.update).toHaveBeenCalledWith({
      where: { id: INVOICE_ID },
      data: { status: PrismaFeeInvoiceStatus.CANCELLED },
      include: {
        payments: {
          orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        },
      },
    });
  });

  it('does not cancel invoices with completed payments', async () => {
    prisma.feeInvoice.findUnique.mockResolvedValue(
      createInvoiceWithPayments({}, [
        createPayment({ amount: new Prisma.Decimal(100), status: PrismaPaymentStatus.COMPLETED }),
      ]),
    );

    await expect(service.cancelInvoice(accountant, INVOICE_ID)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(prisma.feeInvoice.update).not.toHaveBeenCalled();
  });
});
