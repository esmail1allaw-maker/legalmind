import React, { useState } from 'react';
import { X, Save, Loader } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { Client, CustomerType } from '../types/app';

interface AddClientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (client: Client) => void;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export default function AddClientForm({
  isOpen,
  onClose,
  onClientAdded,
  onError,
  onSuccess
}: AddClientFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    type: 'فرد' as CustomerType
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    setValidationError(null);

    if (!formData.name.trim()) {
      setValidationError('اسم الموكل مطلوب');
      return false;
    }

    if (!formData.phone.trim()) {
      setValidationError('رقم الهاتف مطلوب');
      return false;
    }

    const phoneRegex = /^(77|73|71|70)\d{7}$/;
    if (!formData.phone.match(phoneRegex)) {
      setValidationError(
        'يرجى إدخال رقم هاتف يمني صحيح (مثال: 771234567)'
      );
      return false;
    }

    if (!formData.email.trim()) {
      setValidationError('البريد الإلكتروني مطلوب');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.match(emailRegex)) {
      setValidationError('صيغة البريد الإلكتروني غير صحيحة');
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
      // إضافة العميل إلى Supabase
      const { data, error } = await supabase
        .from('clients')
        .insert([
          {
            name: formData.name.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            type: formData.type,
            address: '',
            casesCount: 0,
            createdAt: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // تحديث الـ State المحلي فوراً
      onClientAdded(data);
      onSuccess('تم إضافة الموكل بنجاح إلى قاعدة البيانات');

      // إعادة تعيين النموذج
      setFormData({
        name: '',
        phone: '',
        email: '',
        type: 'فرد'
      });

      // إغلاق النموذج
      onClose();
    } catch (error: any) {
      const errorMessage =
        error.message || 'حدث خطأ أثناء إضافة الموكل';
      onError(errorMessage);
      console.error('خطأ في إضافة الموكل:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* الرأس */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">إضافة موكل جديد</h2>
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

          {/* حقل الاسم */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              اسم الموكل <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="أدخل اسم الموكل الكامل"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              dir="rtl"
            />
          </div>

          {/* حقل الهاتف */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم الهاتف <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="771234567"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1">
              صيغة يمنية: 77/73/71/70 متبوعاً بـ 7 أرقام
            </p>
          </div>

          {/* حقل البريد الإلكتروني */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="user@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              dir="ltr"
            />
          </div>

          {/* حقل نوع العميل */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              نوع العميل <span className="text-red-500">*</span>
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
              dir="rtl"
            >
              <option value="فرد">فرد</option>
              <option value="شركة تجارية">شركة تجارية</option>
            </select>
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
                  حفظ الموكل
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
