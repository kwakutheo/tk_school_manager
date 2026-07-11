import { AcademicTerm, ExamStatus } from '@school-saas/config';

export interface IStudentReportIdentity {
  id: string;
  admissionNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
}

export interface IStudentTermReportResult {
  examId: string;
  title: string;
  subjectId: string;
  subjectName: string;
  examDate: Date;
  maxScore: number;
  score: number;
  percentage: number;
  grade: string | null;
  remarks: string | null;
  weight: number | null;
  status: ExamStatus;
}

export interface IStudentTermReport {
  schoolId: string;
  student: IStudentReportIdentity;
  academicYear: string;
  term: AcademicTerm;
  generatedAt: Date;
  totals: {
    exams: number;
    totalScore: number;
    totalMaxScore: number;
    averagePercentage: number;
  };
  results: IStudentTermReportResult[];
}

export interface IClassTermReportExam {
  id: string;
  title: string;
  subjectId: string;
  subjectName: string;
  examDate: Date;
  maxScore: number;
  status: ExamStatus;
}

export interface IClassTermReportStudentSummary extends IStudentReportIdentity {
  recordedResults: number;
  totalScore: number;
  totalMaxScore: number;
  averagePercentage: number;
}

export interface IClassTermReport {
  schoolId: string;
  classId: string;
  className: string;
  academicYear: string;
  term: AcademicTerm;
  generatedAt: Date;
  totals: {
    enrolledStudents: number;
    exams: number;
    expectedResults: number;
    recordedResults: number;
    classAveragePercentage: number;
  };
  exams: IClassTermReportExam[];
  students: IClassTermReportStudentSummary[];
}
