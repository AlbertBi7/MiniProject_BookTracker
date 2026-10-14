# Book Tracker

A private, offline-first reading list. Track what you want to read, what you are
reading and what you finished — entirely in the browser, with no server, no
account and no database.

Stack: React 18 + Vite (JavaScript, no TypeScript), Vitest + React Testing
Library. No router, no state library, no UI kit, no CDN, no external fonts.

## Run it

```bash
npm install      # install dependencies
npm run dev      # start the Vite dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # serve the production build locally
npm test         # run the Vitest suite once
```

## What it does

- **Add** a book with a title, author and initial status. Title and author are
  required, trimmed and length-checked; errors appear under the field and focus
  moves to the first problem. Duplicates are flagged first and only saved when
  you confirm with **Add anyway**.
- **Search** matches title or author, case-insensitively, on every keystroke, and
  highlights the matched text with `<mark>`.
- **Filter** with the All / To read / Reading / Finished chips and **sort** by
  newest, oldest, title A–Z or author A–Z. The pipeline is always
  filter → search → sort.
- **Update** the status from a card (Finished stamps `finishedAt`), rate a
  finished book 1–5 stars, keep a short note, or edit the title and author inline.
- **Delete** with a 5-second Undo that puts the book back where it was.
- **Persist** everything to localStorage, sync across tabs, and keep working in
  memory (with a notice) when storage is unavailable or corrupt.
- **Export / Import** a JSON backup. Import merges by id and never overwrites
  existing books.
- **Covers** from Open Library, one lookup at a time, with a coloured
  first-letter placeholder whenever the lookup fails, is offline, or is turned off.

## File tree

```
index.html                          App shell: viewport meta, title, pre-paint theme script
vite.config.js                      React plugin + Vitest (jsdom, globals)
package.json                        Scripts: dev, build, preview, test
README.md                           This file
.gitignore                          Ignore node_modules, dist, logs, editor files
public/favicon.svg                  Book glyph favicon

src/main.jsx                        Mounts <BooksProvider><App /></BooksProvider>, imports styles
src/App.jsx                         Layout + cross-cutting wiring (refs, shortcuts, import/export, undo)

src/components/Header.jsx           Theme toggle, Export / Import, "Fetch covers" checkbox
src/components/AddBookForm.jsx      Title + author inputs, status select, Add / Add anyway, aria errors
src/components/Toolbar.jsx          Search input, status chips, sort select
src/components/SummaryStrip.jsx     Counts sentence, total and the progress bar
src/components/BookList.jsx         <ul aria-live="polite">, empty state and no-match state
src/components/BookCard.jsx         Cover, title/author, status, rating, note, inline edit, actions
src/components/BookCover.jsx        Lazy <img> + hashed-colour letter placeholder
src/components/StatusSelect.jsx     Per-book status picker
src/components/Highlight.jsx        Splits text into text + <mark> nodes (no innerHTML, no RegExp)
src/components/Toast.jsx            Transient message with Undo and dismiss

src/context/BooksContext.jsx        BooksProvider + useBooks()

src/state/booksReducer.js           initialState + booksReducer; HYDRATE, ADD, UPDATE, SET_STATUS,
                                    DELETE, RESTORE, SET_COVER, IMPORT, SET_FILTER, SET_SETTINGS
src/state/selectors.js              selectVisibleBooks, selectCounts, describeCounts

src/hooks/usePersistedBooks.js      Lazy load, save-on-change with echo guard, storage events
src/hooks/useCovers.js              One-at-a-time cover queue, abort, offline retry
src/hooks/useTheme.js               system | light | dark, data-theme on <html>, persisted
src/hooks/useDebouncedValue.js      Delayed value (not used by the search box)
src/hooks/useKeyboardShortcuts.js   "/" focuses search, Esc clears it

src/services/storage.js             isAvailable, load/save books, theme, settings, onExternalChange
src/services/coversApi.js           buildSearchUrl, buildCoverUrl, fetchCover (5 s, never throws)
src/services/backup.js              exportJSON, importJSON, backupFileName, downloadTextFile

src/utils/constants.js              Keys, STATUS/LABELS, SORTS, limits, MSG copy
src/utils/validate.js               validateBook, duplicateKey, findDuplicate, sanitizeBook(s)
src/utils/id.js                     generateId: crypto.randomUUID with a fallback

src/styles/tokens.css               Colour, spacing, radii, shadows, fonts; light + dark
src/styles/app.css                  Reset, layout, form, toolbar, cards, rating, toast, a11y
```

## Data model

```js
Book = {
  id,                           // string
  title,                        // string, 1..200 chars
  author,                       // string, 1..100 chars
  status,                       // "to-read" | "reading" | "finished"
  rating,                       // 0..5 (0 = unrated)
  note,                         // string, max 280 chars
  createdAt,                    // ms since epoch
  finishedAt,                   // ms since epoch | null
  coverUrl,                     // string | null
  coverStatus,                  // "none" | "found" | "missing"
}
```

## Acceptance criteria

- [x] Adding "Aadujeevitham" by Benyamin puts it at the top of the list as "To read".
- [x] Submitting with an empty title shows "Please enter a title" under the title box; nothing is saved.
- [x] Submitting with an empty author shows "Please enter an author".
- [x] Searching "ben" and "BEN" return the same result.
- [x] Changing a book's status to Finished updates its label and the summary counts.
- [x] Refreshing the page keeps the books.
- [x] The second book appears above the first (newest first by default).
- [x] Deleting a book and pressing Undo restores it in place.
- [x] The layout works at 375 px with no horizontal scroll (CSS-verified, see limitations).
- [x] A cover appears for a known book while online; offline the placeholder tile is shown.
- [x] A corrupt localStorage value loads an empty list with a notice.
- [x] `npm run build` and `npm test` both pass.

## Feature checklist

- [x] FR-1/2/3/4 Add form: trim, required fields, inline `role="alert"` errors, `aria-invalid`, focus the first invalid field
- [x] FR-5 Clear the form and refocus the title input after a successful add
- [x] FR-6 Duplicate warning with an "Add anyway" confirmation on the second submit
- [x] FR-7/8 ADD builds the full Book record; list is newest-first by default
- [x] FR-9/10 Empty shelf state and no-match / no-status-match states
- [x] FR-11 Sort: newest, oldest, title A–Z, author A–Z (localeCompare, case-insensitive)
- [x] FR-12/13/14 Search: case-insensitive partial match over title OR author, trimmed
- [x] FR-15 Filter chips combine with search
- [x] FR-16 `<mark>` highlighting without RegExp or innerHTML
- [x] FR-17/18/19 Status changes update the label, counts and `finishedAt` immediately
- [x] FR-20/21/22/23 Persistence: lazy load, save on change, sanitise, cross-tab sync, notices
- [x] FR-24 Delete with a 5 s Undo toast; one toast at a time; focus moves on
- [x] FR-25/30 Summary counts sentence, total and `aria-valuenow` progress bar
- [x] FR-26 Responsive at 375 px: 44 px tap targets, wrapping titles, scrollable chips
- [x] FR-27 Inline edit with the same validation, Enter to save, Esc to cancel, cover reset
- [x] FR-28 Rating: 1–5 accessible radios, finished books only, click again to clear
- [x] FR-29 Note: 280 chars with a live counter, saved on blur
- [x] FR-31 Export downloads `book-tracker-backup-YYYY-MM-DD.json`; import merges by id
- [x] FR-32 Theme with a pre-paint inline script to avoid a flash
- [x] FR-33 "/" focuses search, Esc clears it
- [x] FR-34…FR-39 Covers: queued lookups, 5 s timeout, store URLs only, retry, placeholders
- [x] FR-40/41 Covers are best-effort: the app works fully when the API is down or blocked

## Known limitations

- The Open Library search returns the **first** match, which may be a different
  edition (or a translated/parallel edition) than the one you meant. The
  "Find cover" button re-runs the lookup.
- Covers are looked up once per book. If the first lookup misses, the book stays
  on the placeholder until you press "Find cover".
- localStorage can be cleared by the browser or by the user, and private windows
  can refuse it entirely. Use **Export** occasionally if the list matters to you.
- Only the title and author are matched against the API; two books with the same
  title and author are treated as duplicates.
- The 375 px layout is verified by hand and by the CSS rules
  (`overflow-x: hidden`, `overflow-wrap: anywhere`, horizontal chip scrolling) —
  jsdom cannot measure real layout, so it is not covered by an automated test.
- Cover lookups are stubbed in the test suite; the real network path is not
  exercised by `npm test`.

## Privacy

All data stays in your browser (localStorage). Nothing is uploaded, and there is
no server or database. The only network request the app makes is the cover
lookup, which sends just the book's **title and author** to Open Library — and
only while "Fetch covers" is enabled. Turn it off and the app makes no network
requests at all.
