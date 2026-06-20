import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml';

describe('sanitizeHtml', () => {
  it('returns empty string for blank input', () => {
    expect(sanitizeHtml('')).toBe('');
    expect(sanitizeHtml('   ')).toBe('');
  });

  it('strips script tags and content', () => {
    const result = sanitizeHtml('<p>Hello</p><script>alert("xss")</script>');
    expect(result).not.toContain('script');
    expect(result).not.toContain('alert');
    expect(result).toContain('Hello');
  });

  it('removes dangerous attributes from allowed tags', () => {
    const result = sanitizeHtml('<p onclick="evil()">Text</p>');
    expect(result).not.toContain('onclick');
    expect(result).toContain('Text');
  });

  it('preserves basic formatting tags', () => {
    expect(sanitizeHtml('<strong>Bold</strong>')).toBe('<strong>Bold</strong>');
    expect(sanitizeHtml('<em>Italic</em>')).toBe('<em>Italic</em>');
  });

  it('unwraps disallowed tags but keeps text', () => {
    expect(sanitizeHtml('<a href="http://evil.com">Link</a>')).toBe('Link');
  });
});
