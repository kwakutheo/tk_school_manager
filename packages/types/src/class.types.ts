export interface ISchoolClass {
  id: string;
  schoolId: string;
  name: string;
  code: string | null;
  level: string | null;
  section: string | null;
  academicYear: string;
  classTeacherId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
