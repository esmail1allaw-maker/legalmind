export function formatCurrency(value: number): string {
  return value.toLocaleString('ar-YE');
}

export function isValidYemeniPhone(phone: string): boolean {
  return /^(77|73|71|70)\d{7}$/.test(phone);
}
