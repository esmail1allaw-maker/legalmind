import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ProfileAvatarUpload } from '../../components/ProfileAvatarUpload';
import type { ProfilePageProps } from './types';
export function ProfilePage({ user, onSave, onUploadAvatar }: ProfilePageProps) {
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone,
    licenseNo: user.licenseNo
  });
  const [imageUrl, setImageUrl] = useState(user.image);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setForm({ name: user.name, phone: user.phone, licenseNo: user.licenseNo });
    setImageUrl(user.image);
  }, [user]);

  const handleAvatarSelect = async (file: File) => {
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const url = await onUploadAvatar(file);
      setImageUrl(url);
      await onSave({
        fullName: form.name,
        phone: form.phone,
        licenseNo: form.licenseNo,
        profileImage: url
      });
      setSuccess('تم تحديث الصورة الشخصية.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع الصورة.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('يرجى إدخال الاسم الكامل.');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await onSave({
        fullName: form.name.trim(),
        phone: form.phone.trim(),
        licenseNo: form.licenseNo.trim(),
        profileImage: imageUrl
      });
      setSuccess('تم حفظ التعديلات بنجاح.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حفظ الملف الشخصي.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-6 px-4 space-y-6 text-right">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-xl font-black text-slate-900">الملف المهني والترخيص العدلي</h2>

        <ProfileAvatarUpload
          name={form.name}
          imageUrl={imageUrl}
          uploading={uploading}
          onFileSelect={(file) => void handleAvatarSelect(file)}
        />
        <p className="text-[11px] text-slate-500 text-center -mt-2">ستظهر صورتك في أعلى الصفحة بجانب اسم المكتب</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-bold">الاسم الرباعي الكامل</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-right bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-bold">البريد الإلكتروني المهني</label>
            <input type="email" value={user.email} disabled className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-400 text-right bg-slate-100 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-bold">رقم الترخيص القانوني</label>
            <input
              type="text"
              value={form.licenseNo}
              onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-right bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-bold">رقم الجوال اليمني</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-right bg-slate-50"
            />
          </div>
        </div>

        {error ? <p className="text-xs font-bold text-rose-600" role="alert">{error}</p> : null}
        {success ? <p className="text-xs font-bold text-emerald-600" role="status">{success}</p> : null}

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving || uploading}
          className="bg-[#7A1F2B] hover:bg-[#641923] disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs inline-flex items-center gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          حفظ التعديلات والترخيص
        </button>
      </div>
    </div>
  );
}
