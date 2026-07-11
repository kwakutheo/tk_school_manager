export interface ISubject {
  id: string;
  schoolId: string;
  name: string;
  code: string | null;
  department: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
