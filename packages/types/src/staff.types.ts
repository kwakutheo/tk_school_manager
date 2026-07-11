export interface IStaffProfile {
  id: string;
  schoolId: string;
  userId: string | null;
  staffNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  phoneNumber: string | null;
  jobTitle: string | null;
  department: string | null;
  hireDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
