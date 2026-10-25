import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatRange } from '../src/utils/cvUtils';
import { createMockStorage, installMockWindow } from './helpers';

describe('formatRange', () => {
  it('only shows dates the user entered', () => {
    expect(formatRange('', '')).toBe('');
    expect(formatRange('2020', '')).toBe('2020');
    expect(formatRange('', '2022')).toBe('2022');
    expect(formatRange('2020', '2022')).toBe('2020 — 2022');
    expect(formatRange('2020', '2021', true)).toBe('2020 — Present');
  });
});

describe('new entries', () => {
  beforeEach(() => {
    vi.resetModules();
    installMockWindow(createMockStorage().storage);
  });

  it('start empty instead of with sample facts', async () => {
    const { useCVStore } = await import('../src/store/cvStore');
    const store = useCVStore.getState();
    store.initFromStorage();
    store.addEducation();
    store.addProject();
    store.addLanguage();
    store.addSimpleItem('certifications');

    const { document } = useCVStore.getState();
    expect(document.education[0]).toMatchObject({ institution: '', qualification: '', fieldOfStudy: '', startDate: '', endDate: '', description: '' });
    expect(document.projects[0]).toMatchObject({ name: '', role: '', date: '', description: '', link: '', technologies: [] });
    expect(document.languages[0].name).toBe('');
    expect(document.certifications[0]).toMatchObject({ title: '', details: '' });
  });
});
