import fs from 'fs';
import path from 'path';

const root = path.resolve('src/pages');
const src = fs.readFileSync(path.join(root, 'WorkspacePages.tsx'), 'utf8');
const outDir = path.join(root, 'workspace');
fs.mkdirSync(outDir, { recursive: true });

const exports = [...src.matchAll(/export function (\w+)/g)].map((m) => m[1]);
const blocks = src.split(/(?=export function \w+)/);

const sharedTypes = src.slice(0, src.indexOf('export function DashboardPage'));

fs.writeFileSync(path.join(outDir, 'types.ts'), sharedTypes.replace(/^import[\s\S]*?\n\n/, ''));

const importMap = {
  DashboardPage: `import { Briefcase, Calendar, Clock, FileText, MapPin, Plus, Download, AlertCircle, User as UserIcon } from 'lucide-react';
import { SubscriptionStatusBanner } from '../../components/SubscriptionStatusBanner';
import { StatCard } from '../../components/StatCard';
import { FirmCodeCard } from '../../components/FirmCodeCard';
import { useFirmProfile } from '../../hooks/useSupabaseQueries';
import { useFirmSubscription } from '../../hooks/useSubscription';
import { formatPercent, formatYer } from '../../lib/dashboardAnalytics';
import type { DashboardPageProps } from './types';
`,
  ClientsPage: `import { Search, Plus, Trash2, Edit3, Send, MessageCircle } from 'lucide-react';
import type { ClientsPageProps } from './types';
`,
  CasesPage: `import { Briefcase, Search, Plus, Trash2, Edit3, Archive, MessageCircle } from 'lucide-react';
import type { CasesPageProps } from './types';
`,
  SessionsPage: `import { Calendar, Plus, Trash2, Edit3 } from 'lucide-react';
import type { SessionsPageProps } from './types';
`,
  DocumentsPage: `import { FileText, Plus, Download, Loader2 } from 'lucide-react';
import type { DocumentsPageProps } from './types';
`,
  LawyersPage: `import type { LawyersPageProps } from './types';
`,
  ReportsPage: `import { useMemo, useState } from 'react';
import { Briefcase, Lock, Plus, Printer, Trash2, TrendingUp, TrendingDown, Wallet, ChevronDown, ChevronUp, FileSpreadsheet, Loader2 } from 'lucide-react';
import { buildFinancialReport, formatPercent, formatYer } from '../../lib/dashboardAnalytics';
import { exportToCsv, printHtml } from '../../lib/reportsApi';
import { useArchivedCases, useExpenses, useExpenseMutations } from '../../hooks/useSupabaseQueries';
import type { ReportsPageProps } from './types';
`,
  SubscriptionPage: `import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Sparkles } from 'lucide-react';
import { SubscriptionUpgradeModal } from '../../components/SubscriptionUpgradeModal';
import { SubscriptionFeatureList } from '../../components/SubscriptionFeatureList';
import { subscriptionQueryKeys, useFirmSubscription, useSubscriptionRequests } from '../../hooks/useSubscription';
import { SUBSCRIPTION_PLANS, getPlanLabel } from '../../constants/subscription';
import { submitSubscriptionRequest } from '../../lib/subscription';
import type { SubscriptionPlan } from '../../types/app';
`,
  ProfilePage: `import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ProfileAvatarUpload } from '../../components/ProfileAvatarUpload';
import type { ProfilePageProps } from './types';
`,
  SettingsPage: `import { useEffect, useState } from 'react';
import { MfaSettings } from '../../components/MfaSettings';
import { FirmCodeCard } from '../../components/FirmCodeCard';
import { PlatformBankSettings } from '../../components/PlatformBankSettings';
import { SettingsToggleRow } from '../../components/SettingsToggleRow';
import { useFirmProfile } from '../../hooks/useSupabaseQueries';
import { useFirmSettings, useFirmSettingsMutations } from '../../hooks/useFirmSettings';
import type { Office } from '../../types/app';
import type { SettingsPageProps } from './types';
`
};

for (const block of blocks) {
  const match = block.match(/^export function (\w+)/);
  if (!match) continue;
  const name = match[1];
  const imports = importMap[name] ?? '';
  const body = block.trim();
  const expenseConsts =
    name === 'ReportsPage'
      ? `
const EXPENSE_CATS = [
  'إيجار', 'رواتب', 'قرطاسية ومستلزمات مكتبية', 'اتصالات وإنترنت',
  'رسوم قضائية', 'تسويق وإعلان', 'صيانة وتجهيزات', 'مواصلات', 'أخرى'
] as const;

interface AddExpenseFormState {
  title: string;
  amount: string;
  category: string;
  expense_date: string;
  notes: string;
}

const EMPTY_EXPENSE_FORM: AddExpenseFormState = {
  title: '', amount: '', category: 'أخرى', expense_date: (new Date().toISOString().split('T')[0]) ?? '', notes: ''
};

`
      : '';
  fs.writeFileSync(path.join(outDir, `${name}.tsx`), `${imports}${expenseConsts}${body}\n`);
}

const barrel = exports.map((n) => `export { ${n} } from './${n}';`).join('\n');
fs.writeFileSync(path.join(outDir, 'index.ts'), barrel + '\n');

const legacy = exports.map((n) => `export { ${n} } from './workspace/${n}';`).join('\n');
fs.writeFileSync(path.join(root, 'WorkspacePages.tsx'), `/** @deprecated Import from ./workspace/ instead */\n${legacy}\n`);

console.log('Split', exports.length, 'pages into', outDir);
