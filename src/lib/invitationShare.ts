function normalizeYemenPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('967')) return digits;
  if (digits.startsWith('0')) return `967${digits.slice(1)}`;
  return `967${digits}`;
}

export function buildInvitationShareMessage(inviteUrl: string, firmName?: string): string {
  const office = firmName?.trim() || 'مكتبكم القانوني';
  return `السلام عليكم،\n\nتمت دعوتكم للانضمام إلى ${office} عبر LegalMind Yemen.\n\nاضغط الرابط لإكمال التسجيل:\n${inviteUrl}\n\nالرابط صالح 7 أيام.`;
}

export function openInvitationWhatsApp(phone: string, inviteUrl: string, firmName?: string): void {
  const normalized = normalizeYemenPhone(phone);
  const encoded = encodeURIComponent(buildInvitationShareMessage(inviteUrl, firmName));
  window.open(`https://wa.me/${normalized}?text=${encoded}`, '_blank', 'noopener,noreferrer');
}
