/**
 * Shared constants for Book Tracker.
 * Every string, key and limit used across the app lives here.
 */

/* ------------------------------------------------------------------ *
 * Storage keys
 * ------------------------------------------------------------------ */
export const STORAGE_KEY = 'bookTracker.books.v1'
export const THEME_KEY = 'bookTracker.theme'
export const SETTINGS_KEY = 'bookTracker.settings'

/** Default persisted settings. */
export const DEFAULT_SETTINGS = { fetchCovers: true }

/* ------------------------------------------------------------------ *
 * Status
 * ------------------------------------------------------------------ */
export const STATUS = {
  TO_READ: 'to-read',
  READING: 'reading',
  FINISHED: 'finished',
}

export const STATUS_LABELS = {
  'to-read': 'To read',
  reading: 'Reading',
  finished: 'Finished',
}

/** Ordered list of statuses, used by selects, chips and counts. */
export const STATUS_LIST = ['to-read', 'reading', 'finished']

/* ------------------------------------------------------------------ *
 * Sorting
 * ------------------------------------------------------------------ */
export const SORTS = ['newest', 'oldest', 'title-az', 'author-az']

export const SORT_LABELS = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  'title-az': 'Title A–Z',
  'author-az': 'Author A–Z',
}

export const DEFAULT_SORT = 'newest'

/* ------------------------------------------------------------------ *
 * Theme
 * ------------------------------------------------------------------ */
export const THEMES = ['system', 'light', 'dark']
export const DEFAULT_THEME = 'system'

/* ------------------------------------------------------------------ *
 * Limits & timings
 * ------------------------------------------------------------------ */
export const COVER_TIMEOUT_MS = 5000
export const UNDO_MS = 5000
export const DEBOUNCE_MS = 250
export const MAX_TITLE = 200
export const MAX_AUTHOR = 100
export const MAX_NOTE = 280
export const MAX_RATING = 5
export const SEARCH_SHORTCUT = '/'

/* ------------------------------------------------------------------ *
 * User-facing copy
 * ------------------------------------------------------------------ */
export const MSG = {
  titleRequired: 'Please enter a title',
  authorRequired: 'Please enter an author',
  titleTooLong: `Title must be ${MAX_TITLE} characters or fewer`,
  authorTooLong: `Author must be ${MAX_AUTHOR} characters or fewer`,
  duplicate: 'This book is already on your list',
  addAnyway: 'Add anyway',
  emptyShelf: 'Your shelf is empty. Add your first book!',
  noMatch: (q) => `No books match "${q}"`,
  noStatusMatch: (label) => `No books marked "${label}"`,
  noBooksYet: 'No books yet',
  deleted: 'Book deleted.',
  undo: 'Undo',
  save: 'Save',
  saveAnyway: 'Save anyway',
  cancel: 'Cancel',
  edit: 'Edit',
  del: 'Delete',
  findCover: 'Find cover',
  saveError: "Couldn't save. Your changes may be lost when you close this page",
  loadError: "Couldn't read your saved books. Starting with an empty shelf",
  storageUnavailable: 'Saving is unavailable in this browser. Books last for this session only.',
  importError: "That file isn't a valid Book Tracker backup",
  imported: (n) => `Imported ${n} ${n === 1 ? 'book' : 'books'}`,
  importedNone: 'Nothing new to import. Those books are already on your shelf.',
  noCover: 'No cover found. Try again',
}
