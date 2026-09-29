import { describe, expect, it } from 'vitest';
import { isCatalogueEditorProfile, validateDraft } from './catalogue-editor';

describe('catalogue editor input', () => {
  it('recognizes only an explicit catalogue editor user field', () => {
    expect(isCatalogueEditorProfile({ catalogueEditor: true })).toBe(true);
    expect(isCatalogueEditorProfile({ catalogueEditor: false })).toBe(false);
    expect(isCatalogueEditorProfile({ catalogueEditor: 'true' })).toBe(false);
    expect(isCatalogueEditorProfile({ email: 'anicolao@gmail.com' })).toBe(false);
    expect(isCatalogueEditorProfile(null)).toBe(false);
  });

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
