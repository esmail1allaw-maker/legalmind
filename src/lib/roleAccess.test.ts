import { describe, expect, it } from 'vitest';
import { canAccessManagerTools, isFirmManagerRole } from './roleAccess';

describe('roleAccess', () => {
  describe('isFirmManagerRole', () => {
    it('returns true for firm_manager and super_admin', () => {
      expect(isFirmManagerRole('firm_manager')).toBe(true);
      expect(isFirmManagerRole('super_admin')).toBe(true);
    });

    it('returns false for other roles', () => {
      expect(isFirmManagerRole('lawyer')).toBe(false);
      expect(isFirmManagerRole('assistant')).toBe(false);
      expect(isFirmManagerRole('admin')).toBe(false);
    });
  });

  it('canAccessManagerTools is an alias for isFirmManagerRole', () => {
    expect(canAccessManagerTools).toBe(isFirmManagerRole);
  });
});
