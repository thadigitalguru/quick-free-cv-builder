export const STORAGE_KEY = 'quick-free-cv-builder:v3';
/** Where a draft the app couldn't open is set aside instead of being deleted. */
export const CORRUPT_BACKUP_KEY = `${STORAGE_KEY}:unreadable-backup`;
/** Set in sessionStorage (so it never outlives the tab) when the user is on a shared computer. */
export const PUBLIC_COMPUTER_KEY = 'quick-free-cv-builder:public-computer';
