import { describe, expect, it } from 'vitest';
import {
  buildFinancialSummary,
  buildMonthlyChartData,
  buildPerformanceMetrics,
  buildStatHints,
  formatPercent,
  formatYer
} from './dashboardAnalytics';
import type { CaseRecord, Client, DocumentItem, SessionItem } from '../types/app';

const baseCase = (overrides: Partial<CaseRecord> = {}): CaseRecord => ({
  id: 'c1',
  title: 'قضية',
  clientId: 'cl1',
  clientName: 'موكل',
  category: 'تجاري',
  case_type: 'تجارية',
  case_stage: 'استئناف',
  court_case_number: '123',
  total_amount: 100_000,
  paid_amount: 40_000,
  remaining_amount: 60_000,
  status: 'active',
  court: 'محكمة',
  caseNo: '123',
  lawyerId: 'l1',
  description: '',
  notes: '',
  dateStarted: '2026-01-15',
  ...overrides
});

describe('dashboardAnalytics', () => {
  it('formatYer formats Yemeni Rial amounts', () => {
    expect(formatYer(1500)).toContain('ر.ي');
    expect(formatYer(1500)).toMatch(/[\d١٬]+/);
  });

  it('formatPercent adds percent sign', () => {
    expect(formatPercent(75)).toContain('%');
  });

  it('buildFinancialSummary aggregates paid and pending fees', () => {
    const cases = [
      baseCase({ paid_amount: 30_000, remaining_amount: 20_000, status: 'active' }),
      baseCase({ id: 'c2', paid_amount: 10_000, remaining_amount: 5_000, status: 'closed' })
    ];
    const summary = buildFinancialSummary(cases);
    expect(summary.totalPaidFees).toBe(40_000);
    expect(summary.totalPendingFees).toBe(20_000);
  });

  it('buildPerformanceMetrics calculates win and settlement rates', () => {
    const cases = [
      baseCase({ status: 'closed', judgment_date: '2026-02-01' }),
      baseCase({ id: 'c2', status: 'archived', judgment_date: '' })
    ];
    const sessions: SessionItem[] = [
      { id: 's1', caseId: 'c1', caseTitle: 'ق', court: 'مح', date: '2026-03-01', time: '10:00', status: 'مجدولة', type: '', notes: '' }
    ];
    const metrics = buildPerformanceMetrics(cases, sessions);
    expect(metrics.winRate).toBe(50);
    expect(metrics.settlementRate).toBe(50);
  });

  it('buildMonthlyChartData buckets cases by start month', () => {
    const cases = [baseCase({ dateStarted: '2026-06-10', paid_amount: 5000 })];
    const data = buildMonthlyChartData(cases, 2026);
    const juneBucket = data.find((d) => d.month === 'يونيو');
    expect(juneBucket?.cases).toBe(1);
    expect(juneBucket?.revenue).toBe(5000);
  });

  it('buildStatHints includes client and session labels', () => {
    const clients: Client[] = [
      { id: 'cl1', name: 'A', phone: '770000000', email: 'a@t.com', address: '', type: 'شركة تجارية', casesCount: 1, createdAt: '2026-01-01' }
    ];
    const sessions: SessionItem[] = [];
    const documents: DocumentItem[] = [];
    const hints = buildStatHints([baseCase()], clients, sessions, documents);
    expect(hints.corporateClientsLabel).toContain('شركة');
  });
});
