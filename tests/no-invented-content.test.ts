import { beforeEach, describe, expect, it, vi } from 'vitest';
import { formatRange } from '../src/utils/cvUtils';
import { createMockStorage, installMockWindow } from './helpers';

describe('formatRange', () => {
  it('only shows dates the user entered', () => {
    expect(formatRange('', '')).toBe('');
    expect(formatRange('2020', '')).toBe('2020');
    expect(formatRange('', '2022')).toBe('2022');
    expect(formatRange('2020', '2022')).toBe('2020 – 2022');
    expect(formatRange('2020', '2021', true)).toBe('2020 – Present');
    // Months read as words, and only where the user gave a month.
    expect(formatRange('2021-03', '', true)).toBe('Mar 2021 – Present');
    expect(formatRange('2018-01', '2021-12')).toBe('Jan 2018 – Dec 2021');
    expect(formatRange('2018-01', '2021')).toBe('Jan 2018 – 2021');
    // Anything that isn't YYYY-MM stays exactly as typed.
    expect(formatRange('Summer 2020', '2021-13')).toBe('Summer 2020 – 2021-13');
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
