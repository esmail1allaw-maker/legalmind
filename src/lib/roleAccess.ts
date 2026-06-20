import type { UserRole } from '../types/app';

/** مدير المكتب — الوصول الكامل للوحة الإدارة وبيانات القضية */
export function isFirmManagerRole(role: UserRole | string): boolean {
  return role === 'firm_manager' || role === 'super_admin';
}
