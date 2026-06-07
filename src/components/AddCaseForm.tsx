import React, { useState } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { CaseRecord, Client } from '../types/app';

interface AddCaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseAdded: (caseRecord: CaseRecord) => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
  clients: Client[];
}

export default function AddCaseForm({
  isOpen,
  onClose,
  onCaseAdded,
  onError,
  onSuccess,
  clients
}: AddCaseFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    clientId: '',
    category: 'تجاري',
    status: 'نشط',
    court: '',
    caseNo: '',
    lawyerId: '',
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    setValidationError(null);

    if (!formData.title.trim()) {
      setValidationError('عنوان القضية مطلوب');
      return false;
    }

    if (!formData.clientId) {
      setValidationError('يجب اختيار عميل مرتبط بالقضية');
      return false;
    }

    if (!formData.court.trim()) {
      setValidationError('اسم المحكمة مطلوب');
      return false;
    }

    if (!formData.caseNo.trim()) {
      setValidationError('الرقم القضائي مطلوب');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // البحث عن اسم العميل
      const selectedClient = clients.find(c => c.id === formData.clientId);
      const clientName = selectedClient?.name || 'غير محدد';

      // إضافة القضية إلى Supabase
      const { data, error } = await supabase
        .from('cases')
        .insert([
          {
            title: formData.title.trim(),
            clientId: formData.clientId,
            clientName: clientName,
            category: formData.category,
            status: formData.status,
            court: formData.court.trim(),
            caseNo: formData.caseNo.trim(),
            lawyerId: formData.lawyerId || null,
            dateStarted: new Date().toISOString(),
            description: formData.description.trim()
          }
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // تحديث الـ State المحلي فوراً
      onCaseAdded(data);
      onSuccess('تم إضافة القضية بنجاح إلى قاعدة البيانات');

      // إعادة تعيين النموذج
      setFormData({
        title: '',
        clientId: '',
        category: 'تجاري',
        status: 'نشط',
        court: '',
        caseNo: '',
        lawyerId: '',
        description: ''
      });

      // إغلاق النموذج
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.message || 'حدث خطأ أثناء إضافة القضية';
      onError(errorMessage);
      console.error('خطأ في إضافة القضية:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setValidationError(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* الرأس */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-800">إضافة قضية جديدة</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* محتوى النموذج */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* رسالة الخطأ */}
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{validationError}</p>
            </div>
          )}

          {/* الصف الأول: عنوان القضية والعميل */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* حقل عنوان القضية */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عنوان القضية <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="أدخل عنوان القضية"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                dir="rtl"
              />
            </div>

            {/* حقل اختيار العميل */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                العميل المرتبط <span className="text-red-500">*</span>
              </label>
              <select
                name="clientId"
                value={formData.clientId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                dir="rtl"
              >
                <option value="">-- اختر عميلاً --</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {clients.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ لا توجد عملاء. يرجى إضافة عميل أولاً.
                </p>
              )}
            </div>
          </div>

          {/* الصف الثاني: الفئة والحالة */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* حقل الفئة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                فئة القضية <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                dir="rtl"
              >
                <option value="تجاري">تجاري</option>
                <option value="مدني">مدني</option>
                <option value="عقاري">عقاري</option>
                <option value="جنائي">جنائي</option>
                <option value="عمل">عمل</option>
                <option value="أسرة">أسرة</option>
                <option value="إداري">إداري</option>
              </select>
            </div>

            {/* حقل الحالة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                حالة القضية <span className="text-red-500">*</span>
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                dir="rtl"
              >
                <option value="نشط">نشط</option>
                <option value="تحت الدراسة">تحت الدراسة</option>
                <option value="مغلق">مغلق</option>
                <option value="مرفوع">مرفوع</option>
              </select>
            </div>
          </div>

          {/* الصف الثالث: المحكمة والرقم القضائي */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* حقل اسم المحكمة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسم المحكمة <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="court"
                value={formData.court}
                onChange={handleChange}
                placeholder="مثال: محكمة استئناف الأمانة"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                dir="rtl"
              />
            </div>

            {/* حقل الرقم القضائي */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                الرقم القضائي <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="caseNo"
                value={formData.caseNo}
                onChange={handleChange}
                placeholder="مثال: 123/2023"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
                dir="ltr"
              />
            </div>
          </div>

          {/* حقل معرّف المحامي */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              معرّف المحامي (اختياري)
            </label>
            <input
              type="text"
              name="lawyerId"
              value={formData.lawyerId}
              onChange={handleChange}
              placeholder="معرّف المحامي المسؤول"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              dir="ltr"
            />
          </div>

          {/* حقل الوصف */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              وصف القضية (اختياري)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="أدخل وصفاً تفصيلياً للقضية..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              rows={3}
              dir="rtl"
            />
          </div>

          {/* الأزرار */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
              disabled={isSubmitting}
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save size={18} />
                  حفظ القضية
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
