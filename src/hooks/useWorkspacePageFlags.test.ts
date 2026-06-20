import { describe, expect, it } from 'vitest';
import { useWorkspacePageFlags } from './useWorkspacePageFlags';
import type { PageId } from '../types/app';

function flagsFor(page: PageId, isAuth = true, role: 'lawyer' | 'firm_manager' = 'lawyer') {
  return useWorkspacePageFlags(page, isAuth, role);
}

describe('useWorkspacePageFlags', () => {
  it('loads clients only on relevant pages', () => {
    expect(flagsFor('subscription').needsClients).toBe(false);
    expect(flagsFor('clients').needsClients).toBe(true);
    expect(flagsFor('dashboard').needsClients).toBe(true);
  });

  it('loads cases for reports and sessions pages', () => {
    expect(flagsFor('reports').needsCases).toBe(true);
    expect(flagsFor('sessions').needsCases).toBe(true);
    expect(flagsFor('profile').needsCases).toBe(false);
  });

  it('loads manager data on employees page for firm_manager only', () => {
    const managerFlags = useWorkspacePageFlags('employees', true, 'firm_manager');
    const lawyerFlags = useWorkspacePageFlags('employees', true, 'lawyer');
    expect(managerFlags.needsManagerDataOnEmployees).toBe(true);
    expect(lawyerFlags.needsManagerDataOnEmployees).toBe(false);
    expect(managerFlags.needsLawyers).toBe(true);
    expect(lawyerFlags.needsLawyers).toBe(false);
  });

  it('marks public pages correctly', () => {
    expect(flagsFor('landing', false).isPublicPage).toBe(true);
    expect(flagsFor('dashboard').isPublicPage).toBe(false);
  });
});
