import {
  AcademicTerm,
  FeeInvoiceStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from '@school-saas/config';

export interface IFeeInvoice {
  id: string;
  schoolId: string;
  studentId: string;
  studentEnrollmentId: string;
  academicYear: string;
  term: AcademicTerm;
  title: string;
  description: string | null;
  dueDate: Date;
  amount: number;
  amountPaid: number;
  balance: number;
  status: FeeInvoiceStatus;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeePayment {
  id: string;
  schoolId: string;
  invoiceId: string;
  studentId: string;
  studentEnrollmentId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  provider: PaymentProvider | null;
  providerTransactionId: string | null;
  providerReference: string | null;
  providerStatus: string | null;
  providerMetadata: unknown | null;
  reference: string | null;
  notes: string | null;
  paidAt: Date;
  recordedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFeeInvoiceWithPayments extends IFeeInvoice {
  payments: IFeePayment[];
}

export interface IFeeInvoiceGenerationResult {
  schoolId: string;
  classId: string;
  academicYear: string;
  term: AcademicTerm;
  title: string;
  requestedEnrollments: number;
  createdInvoices: number;
  skippedExistingInvoices: number;
  invoices: IFeeInvoice[];
}

export interface IFinanceSummary {
  schoolId: string;
  academicYear: string | null;
  term: AcademicTerm | null;
  asOfDate: Date;
  totals: {
    invoices: number;
    openInvoices: number;
    partiallyPaidInvoices: number;
    paidInvoices: number;
    cancelledInvoices: number;
    totalInvoiced: number;
    totalPaid: number;
    outstandingBalance: number;
    overdueBalance: number;
  };
}
