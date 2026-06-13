import { supabase } from './supabaseClient';

const FIRM_CODE_PATTERN = /^[A-Z]{3}-[0-9]{4}$/;

export function normalizeFirmCode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}

export function isValidFirmCodeFormat(value: string): boolean {
  return FIRM_CODE_PATTERN.test(normalizeFirmCode(value));
}

export function buildFirmCodePrefix(firmName: string): string {
  const words = firmName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const firstLongWord = words.find((word) => word.length >= 3);
  const prefix = firstLongWord?.slice(0, 3) ?? words.map((word) => word[0]).join('').slice(0, 3);

  return prefix.padEnd(3, 'X').slice(0, 3);
}

export function generateFirmCodeCandidate(firmName: string): string {
  const randomValues = crypto.getRandomValues(new Uint32Array(1));
  const digits = (randomValues[0] ?? 0) % 10000;
  return `${buildFirmCodePrefix(firmName)}-${String(digits).padStart(4, '0')}`;
}

export async function generateUniqueFirmCode(firmName: string, maxAttempts = 20): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generateFirmCodeCandidate(firmName);
    const { data, error } = await supabase.rpc('office_code_exists', { office_code_input: code });
    if (error) throw error;
    if (!data) return code;
  }

  throw new Error('تعذر إنشاء كود مكتب فريد. يرجى المحاولة مرة أخرى.');
}
