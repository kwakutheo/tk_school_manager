import { Role } from '@school-saas/config';

export interface IUser {
  id: string;
  schoolId: string | null;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IUserPublic = Omit<IUser, 'passwordHash'>;

export interface IUserWithRole extends IUserPublic {
  role: Role;
}
