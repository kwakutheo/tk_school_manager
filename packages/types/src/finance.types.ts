import { AcademicTerm, FeeInvoiceStatus, PaymentMethod, PaymentStatus } from '@school-saas/config';

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
