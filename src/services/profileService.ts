import { supabase } from '../lib/supabaseClient';
import type { UserRole } from '../types/app';

export interface OfficeProfileContext {
  userId: string;
  profileId: string;
  officeId: string;
  firmId: string | null;
  employeeId: string | null;
  fullName: string;
  email: string;
  role: Extract<UserRole, 'admin' | 'lawyer' | 'assistant'>;
  officeName: string;
  officeCode: string;
}

interface ProfileContextRow {
  id: string;
  office_id: string;
  employee_id: string | null;
  full_name: string;
  email: string;
  role: Extract<UserRole, 'admin' | 'lawyer' | 'assistant'>;
  offices: {
    id: string;
    firm_id: string | null;
    name: string;
    office_code: string;
  } | null;
}

interface RawProfileContextRow extends Omit<ProfileContextRow, 'offices'> {
  offices:
    | ProfileContextRow['offices']
    | NonNullable<ProfileContextRow['offices']>[];
}

export async function getCurrentProfileContext(): Promise<OfficeProfileContext | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, office_id, employee_id, full_name, email, role, offices(id, firm_id, name, office_code)')
    .eq('id', authData.user.id)
    .is('deleted_at', null)
    .single();

  if (error) throw error;

  const row = data as unknown as RawProfileContextRow;
  const office = Array.isArray(row.offices) ? row.offices[0] : row.offices;
  if (!office) return null;

  return {
    userId: authData.user.id,
    profileId: row.id,
    officeId: row.office_id,
    firmId: office.firm_id,
    employeeId: row.employee_id,
    fullName: row.full_name,
    email: row.email,
    role: row.role,
    officeName: office.name,
    officeCode: office.office_code
  };
}

export async function requireAdminProfile(): Promise<OfficeProfileContext> {
  const context = await getCurrentProfileContext();
  if (!context) throw new Error('لم يتم العثور على ملف المستخدم.');
  if (context.role !== 'admin') throw new Error('هذه العملية متاحة لمدير المكتب فقط.');
  return context;
}
