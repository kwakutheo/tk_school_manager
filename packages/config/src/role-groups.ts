import { Role } from './roles.enum';

export const PLATFORM_ROLES = [Role.SUPER_ADMIN, Role.SUPPORT_ADMIN, Role.SYSTEM_AUDITOR] as const;

export const SCHOOL_ADMIN_ROLES = [
  Role.SCHOOL_OWNER,
  Role.HEADMASTER,
  Role.VICE_PRINCIPAL,
  Role.SCHOOL_ADMIN,
  Role.ACADEMIC_COORDINATOR,
  Role.ADMIN_OFFICER,
] as const;

export const TEACHING_ROLES = [
  Role.TEACHER,
  Role.HEAD_OF_DEPARTMENT,
  Role.CLASS_TEACHER,
  Role.EXAM_OFFICER,
  Role.LAB_INSTRUCTOR,
  Role.SUBSTITUTE_TEACHER,
] as const;

export const STUDENT_GUARDIAN_ROLES = [Role.STUDENT, Role.PARENT] as const;

export const SUPPORT_STAFF_ROLES = [
  Role.ACCOUNTANT,
  Role.RECEPTIONIST,
  Role.LIBRARIAN,
  Role.IT_ADMIN,
] as const;

export const SCHOOL_SCOPED_ROLES = [
  ...SCHOOL_ADMIN_ROLES,
  ...TEACHING_ROLES,
  ...STUDENT_GUARDIAN_ROLES,
  ...SUPPORT_STAFF_ROLES,
] as const;

export const ADMIN_TIER_ROLES = [
  Role.SUPER_ADMIN,
  Role.SCHOOL_OWNER,
  Role.HEADMASTER,
  Role.VICE_PRINCIPAL,
  Role.SCHOOL_ADMIN,
  Role.ACADEMIC_COORDINATOR,
  Role.ADMIN_OFFICER,
] as const;

export function isPlatformRole(role: Role): boolean {
  return PLATFORM_ROLES.includes(role as (typeof PLATFORM_ROLES)[number]);
}

export function isSchoolScopedRole(role: Role): boolean {
  return SCHOOL_SCOPED_ROLES.includes(role as (typeof SCHOOL_SCOPED_ROLES)[number]);
}
