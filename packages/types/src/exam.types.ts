import { AcademicTerm, ExamStatus } from '@school-saas/config';

export interface IExam {
  id: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  academicYear: string;
  term: AcademicTerm;
  title: string;
  examDate: Date;
  maxScore: number;
  weight: number | null;
  status: ExamStatus;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExamResult {
  id: string;
  schoolId: string;
  examId: string;
  studentId: string;
  studentEnrollmentId: string;
  score: number;
  grade: string | null;
  remarks: string | null;
  recordedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExamWithResults extends IExam {
  results: IExamResult[];
}
