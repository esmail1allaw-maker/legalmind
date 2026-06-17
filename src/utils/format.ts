export function formatCurrency(value: number): string {
  return value.toLocaleString('ar-YE');
}

const EASTERN_ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

/** Strip formatting/country code; store local 9-digit Yemen mobile (e.g. 770123456). */
export function normalizeYemeniPhoneForStorage(phone: string): string {
  let value = phone.trim();
  for (let i = 0; i < 10; i += 1) {
    value = value.replace(new RegExp(EASTERN_ARABIC_DIGITS[i]!, 'g'), String(i));
    value = value.replace(new RegExp(PERSIAN_DIGITS[i]!, 'g'), String(i));
  }

  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('967') && digits.length > 9) digits = digits.slice(3);
  if (digits.startsWith('0') && digits.length > 9) digits = digits.slice(1);
  return digits;
}

export function isValidYemeniPhone(phone: string): boolean {
  return /^(77|73|71|70)\d{7}$/.test(normalizeYemeniPhoneForStorage(phone));
}
