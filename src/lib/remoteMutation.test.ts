import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mutateRemoteOrLocal, shouldUseRemoteBackend } from './remoteMutation';

vi.mock('./supabaseClient', () => ({
  isSupabaseConfigured: vi.fn()
}));

vi.mock('./syncEngine', () => ({
  isOnline: vi.fn()
}));

import { isSupabaseConfigured } from './supabaseClient';
import { isOnline } from './syncEngine';

describe('remoteMutation', () => {
  beforeEach(() => {
    vi.mocked(isSupabaseConfigured).mockReset();
    vi.mocked(isOnline).mockReset();
  });

  describe('shouldUseRemoteBackend', () => {
    it('returns true when Supabase is configured and online', () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(isOnline).mockReturnValue(true);
      expect(shouldUseRemoteBackend()).toBe(true);
    });

    it('returns false when offline', () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(isOnline).mockReturnValue(false);
      expect(shouldUseRemoteBackend()).toBe(false);
    });

    it('returns false when Supabase is not configured', () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(false);
      vi.mocked(isOnline).mockReturnValue(true);
      expect(shouldUseRemoteBackend()).toBe(false);
    });
  });

  describe('mutateRemoteOrLocal', () => {
    it('calls remoteFn when backend is remote', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(isOnline).mockReturnValue(true);

      const remoteFn = vi.fn().mockResolvedValue('remote');
      const localFn = vi.fn().mockResolvedValue('local');

      await expect(mutateRemoteOrLocal(remoteFn, localFn)).resolves.toBe('remote');
      expect(remoteFn).toHaveBeenCalledOnce();
      expect(localFn).not.toHaveBeenCalled();
    });

    it('calls localFn when offline', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(isOnline).mockReturnValue(false);

      const remoteFn = vi.fn().mockResolvedValue('remote');
      const localFn = vi.fn().mockResolvedValue('local');

      await expect(mutateRemoteOrLocal(remoteFn, localFn)).resolves.toBe('local');
      expect(localFn).toHaveBeenCalledOnce();
      expect(remoteFn).not.toHaveBeenCalled();
    });

    it('propagates remote errors without falling back to local', async () => {
      vi.mocked(isSupabaseConfigured).mockReturnValue(true);
      vi.mocked(isOnline).mockReturnValue(true);

      const remoteFn = vi.fn().mockRejectedValue(new Error('remote failed'));
      const localFn = vi.fn().mockResolvedValue('local');

      await expect(mutateRemoteOrLocal(remoteFn, localFn)).rejects.toThrow('remote failed');
      expect(localFn).not.toHaveBeenCalled();
    });
  });
});
