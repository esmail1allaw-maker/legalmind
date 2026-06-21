import { useEffect, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { PermissionMatrix } from './PermissionMatrix';
import {
  fetchEmployeePermissions,
  fetchFirmRoles,
  updateEmployeePermissions
} from '../lib/permissions';
import type { PermissionKey } from '../types/app';
import { toArabicQueryError } from './QueryErrorBanner';

interface EmployeePermissionsModalProps {
  open: boolean;
  employeeId: string | null;
  employeeName: string;
  onClose: () => void;
  onSaved?: () => void;
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export function EmployeePermissionsModal({
  open,
  employeeId,
  employeeName,
  onClose,
  onSaved,
  onNotify
}: EmployeePermissionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  useEffect(() => {
    if (!open || !employeeId) return;

    setLoading(true);
    void Promise.all([fetchEmployeePermissions(employeeId), fetchFirmRoles()])
      .then(([perms, firmRoles]) => {
        setPermissions(perms);
        setRoles(firmRoles.map((r) => ({ id: r.id, name: r.name })));
      })
      .catch((err) => onNotify?.(toArabicQueryError(err, 'تحميل صلاحيات الموظف'), 'error'))
      .finally(() => setLoading(false));
  }, [open, employeeId, onNotify]);

  if (!open || !employeeId) return null;

  const togglePermission = (key: PermissionKey) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleApplyTemplate = () => {
    if (!selectedRoleId) return;
    void fetchFirmRoles()
      .then((firmRoles) => {
        const role = firmRoles.find((r) => r.id === selectedRoleId);
        if (role) setPermissions({ ...role.permissions });
      })
      .catch((err) => onNotify?.(toArabicQueryError(err, 'تحميل القالب'), 'error'));
  };

  const handleSave = () => {
    setSaving(true);
    void updateEmployeePermissions(employeeId, permissions)
      .then(() => {
        onNotify?.('تم حفظ صلاحيات الموظف.', 'success');
        onSaved?.();
        onClose();
      })
      .catch((err) => onNotify?.(toArabicQueryError(err, 'حفظ الصلاحيات'), 'error'))
      .finally(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" dir="rtl">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-black text-slate-900">صلاحيات الموظف</h3>
            <p className="mt-0.5 text-xs text-slate-500">{employeeName}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-[#7A1F2B]" />
            </div>
          ) : (
            <>
              <div className="mb-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="mb-2 text-[11px] font-bold text-slate-600">نسخ صلاحيات من قالب جاهز</p>
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="min-w-[180px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none"
                  >
                    <option value="">— اختر قالباً —</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleApplyTemplate}
                    disabled={!selectedRoleId}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                  >
                    تطبيق على المحرر
                  </button>
                </div>
                <p className="mt-2 text-[10px] text-slate-500">
                  يمكنك تعديل الصلاحيات يدوياً بعد تطبيق القالب. الموظف يرى فقط ما تفعّله هنا.
                </p>
              </div>

              <PermissionMatrix permissions={permissions} onToggle={togglePermission} />
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSave}
            className="flex items-center gap-2 rounded-xl bg-[#7A1F2B] px-4 py-2 text-xs font-bold text-white hover:bg-[#641923] disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            حفظ الصلاحيات
          </button>
        </div>
      </div>
    </div>
  );
}
