import { Download, Loader2, Printer } from 'lucide-react';

interface CaseExportToolbarProps {
  exporting: boolean;
  printing: boolean;
  onDownload: () => void;
  onPrint: () => void;
  variant?: 'top' | 'bottom';
}

export function CaseExportToolbar({
  exporting,
  printing,
  onDownload,
  onPrint,
  variant = 'top'
}: CaseExportToolbarProps) {
  if (variant === 'bottom') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-4">
        <PrintButton printing={printing} onPrint={onPrint} />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-[#7A1F2B]/30 bg-[#7A1F2B]/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-800">تنزيل وطباعة بيانات القضية</p>
          <p className="mt-1 text-xs text-slate-500">
            ملف واحد (ZIP) يضم التقرير الكامل، الوثائق، تغييرات المحامي، الجلسات، الدفعات، والسجل من البداية حتى الآن.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={exporting || printing}
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#7A1F2B] px-3 py-2 text-xs font-bold text-white hover:bg-[#6a1a25] disabled:opacity-50"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            تنزيل كل بيانات القضية
          </button>
          <PrintButton printing={printing} onPrint={onPrint} />
        </div>
      </div>
    </div>
  );
}

function PrintButton({ printing, onPrint }: { printing: boolean; onPrint: () => void }) {
  return (
    <button
      type="button"
      disabled={printing}
      onClick={onPrint}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
    >
      {printing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
      طباعة
    </button>
  );
}
