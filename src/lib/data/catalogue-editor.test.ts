import { describe, expect, it } from 'vitest';
import { validateDraft } from './catalogue-editor';

describe('catalogue editor input', () => {
  it('normalizes a title, HTTPS URL, and optional icon', () => {
    expect(validateDraft({
      title: ' Snappy Maria ',
      url: 'https://games.example.test/snappy-maria',
      icon: ' https://images.example.test/snappy-maria.png '
    })).toEqual({
      title: 'Snappy Maria',
      url: 'https://games.example.test/snappy-maria',
      icon: 'https://images.example.test/snappy-maria.png'
    });
  });

  it('permits an empty icon without weakening launch URL validation', () => {
    expect(validateDraft({
      title: 'Caravan',
      url: 'https://games.example.test/caravan',
      icon: ''
    }).icon).toBe('');
    expect(() => validateDraft({
      title: 'Unsafe',
      url: 'javascript:alert(1)',
      icon: ''
    })).toThrow('HTTPS launch URL');
  });

  it('preserves safe site-relative legacy icons', () => {
    expect(validateDraft({
      title: 'Caravan',
      url: 'https://games.example.test/caravan',
      icon: '/icons/caravan.svg'
    }).icon).toBe('/icons/caravan.svg');
  });
});
