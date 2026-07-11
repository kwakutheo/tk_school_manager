-- CreateEnum
CREATE TYPE "FeeInvoiceStatus" AS ENUM ('OPEN', 'PARTIALLY_PAID', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'MOBILE_MONEY', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateTable
CREATE TABLE "fee_invoices" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "student_enrollment_id" UUID NOT NULL,
    "academic_year" TEXT NOT NULL,
    "term" "AcademicTerm" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "FeeInvoiceStatus" NOT NULL DEFAULT 'OPEN',
    "created_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fee_payments" (
    "id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "student_enrollment_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'COMPLETED',
    "reference" TEXT,
    "notes" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recorded_by_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fee_invoices_school_id_student_id_academic_year_term_title_key" ON "fee_invoices"("school_id", "student_id", "academic_year", "term", "title");

-- CreateIndex
CREATE INDEX "fee_invoices_school_id_academic_year_term_idx" ON "fee_invoices"("school_id", "academic_year", "term");

-- CreateIndex
CREATE INDEX "fee_invoices_school_id_status_idx" ON "fee_invoices"("school_id", "status");

-- CreateIndex
CREATE INDEX "fee_invoices_student_id_academic_year_idx" ON "fee_invoices"("student_id", "academic_year");

-- CreateIndex
CREATE INDEX "fee_invoices_student_enrollment_id_idx" ON "fee_invoices"("student_enrollment_id");

-- CreateIndex
CREATE INDEX "fee_invoices_created_by_id_idx" ON "fee_invoices"("created_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "fee_payments_school_id_reference_key" ON "fee_payments"("school_id", "reference");

-- CreateIndex
CREATE INDEX "fee_payments_school_id_paid_at_idx" ON "fee_payments"("school_id", "paid_at");

-- CreateIndex
CREATE INDEX "fee_payments_school_id_status_idx" ON "fee_payments"("school_id", "status");

-- CreateIndex
CREATE INDEX "fee_payments_invoice_id_status_idx" ON "fee_payments"("invoice_id", "status");

-- CreateIndex
CREATE INDEX "fee_payments_student_id_paid_at_idx" ON "fee_payments"("student_id", "paid_at");

-- CreateIndex
CREATE INDEX "fee_payments_student_enrollment_id_idx" ON "fee_payments"("student_enrollment_id");

-- CreateIndex
CREATE INDEX "fee_payments_recorded_by_id_idx" ON "fee_payments"("recorded_by_id");

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_student_enrollment_id_fkey" FOREIGN KEY ("student_enrollment_id") REFERENCES "student_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_invoices" ADD CONSTRAINT "fee_invoices_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "fee_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_student_enrollment_id_fkey" FOREIGN KEY ("student_enrollment_id") REFERENCES "student_enrollments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fee_payments" ADD CONSTRAINT "fee_payments_recorded_by_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
