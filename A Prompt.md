# A Prompt.md

A record of every prompt given in this session, in order, verbatim.

---
## Prompt 1 — Requirment Planning

You are a senior SDE and this is a capstone project you need to build. The features given above are the bare minimum but not limited to. Make a Software requirement plan for this project with the tech stack keeping it simple, features which include the above but also more that makes the project stand out. The UI requirements, no need of a database no server.

## Prompt 2 — New Feature Suggestion

Can we add an image from a public book API?

## Prompt 3 — Skeleton

ROLE: Senior front-end engineer. Create the SKELETON of "Book Tracker" using React 18 + Vite (JavaScript, NOT TypeScript). Structure only: no feature logic. Every function/component body is a stub with a TODO that names the plan's requirement ID (FR-xx). No server, no database.
SPEED RULES
- Scaffold with: npm create vite@latest book-tracker -- --template react, then npm install. Then delete boilerplate (src/App.css, src/index.css, src/assets, default App content) and write ALL new files in one shell command or one multi-file write (each file once).
- Install nothing else except dev dependencies: vitest, @testing-library/react, @testing-library/jest-dom, jsdom. No router, no state library, no UI kit, no CSS framework, no external CDN.
- No explaining, no questions, no re-reading files. Verify only at the end (DONE CHECK).

FILE TREE (create exactly this)
index.html (viewport meta: width=device-width, initial-scale=1, viewport-fit=cover; title "Book Tracker"), vite.config.js (react plugin + vitest: environment jsdom, globals true), package.json scripts: dev, build, preview, test; README.md; .gitignore; public/favicon.svg
src/main.jsx — mounts <BooksProvider><App/></BooksProvider>
src/App.jsx — layout composing: Header, AddBookForm, Toolbar, SummaryStrip, BookList, Toast
src/components/: Header, AddBookForm, Toolbar, SummaryStrip, BookList, BookCard, BookCover, StatusSelect, Highlight, Toast (.jsx each)
src/context/BooksContext.jsx — BooksProvider + useBooks() returning {books, filters, visibleBooks, counts, dispatch, setFilter, toast, showToast}
src/state/booksReducer.js — initialState, booksReducer; actions: ADD, UPDATE, SET_STATUS, DELETE, RESTORE, SET_COVER, IMPORT (stubs with FR ids)
src/state/selectors.js — selectVisibleBooks(books, filters) (filter by status, then search title/author case-insensitive, then sort), selectCounts(books) -> {total,toRead,reading,finished,percentFinished}
src/hooks/: usePersistedBooks, useCovers, useTheme, useDebouncedValue, useKeyboardShortcuts ("/" focuses search, Esc clears it) (.js)
src/services/: storage.js (isAvailable, loadBooks with try/catch fallback [], saveBooks, loadTheme, saveTheme, loadSettings, saveSettings, onExternalChange for the storage event), coversApi.js (buildSearchUrl, buildCoverUrl, fetchCover with AbortController 5 s timeout that never throws), backup.js (exportJSON, importJSON with validation)
src/utils/: constants.js, validate.js (validateBook -> {valid, errors:{title,author}}), id.js (generateId: crypto.randomUUID with fallback)
src/styles/tokens.css, src/styles/app.css (import both in main.jsx)
Tests next to code: src/state/booksReducer.test.js, src/state/selectors.test.js, src/utils/validate.test.js (a few it() stubs marked TODO, they must run)

CONSTANTS (src/utils/constants.js, fill in fully)
STORAGE_KEY "bookTracker.books.v1"; THEME_KEY "bookTracker.theme"; SETTINGS_KEY "bookTracker.settings" (default {fetchCovers:true}); STATUS {TO_READ:"to-read", READING:"reading", FINISHED:"finished"} + STATUS_LABELS {to-read:"To read", reading:"Reading", finished:"Finished"}; SORTS newest|oldest|title-az|author-az (default newest); COVER_TIMEOUT_MS 5000; UNDO_MS 5000; MAX_TITLE 200; MAX_AUTHOR 100; MSG: titleRequired "Please enter a title", authorRequired "Please enter an author", duplicate "This book is already on your list", emptyShelf "Your shelf is empty. Add your first book!", noMatch(q) -> 'No books match "q"', deleted "Book deleted.", undo "Undo", saveError "Couldn't save. Your changes may be lost when you close this page", importError "That file isn't a valid Book Tracker backup", noCover "No cover found. Try again".

DATA MODEL (JSDoc typedef in booksReducer.js)
Book = {id, title, author, status, rating (0-5), note, createdAt (ms), finishedAt (ms|null), coverUrl (string|null), coverStatus ("none"|"found"|"missing")}

COMPONENT CONTRACTS (write real JSX markup with props documented in JSDoc; behaviour = TODO)
- Header: title, theme toggle button, Export button, Import button + hidden file input (accept .json), "Fetch covers" checkbox.
- AddBookForm: labelled inputs Title and Author, status select (To read default), Add button; error <p role="alert"> under each field linked with aria-describedby + aria-invalid; duplicate warning slot; title input ref for refocus after add (FR-5).
- Toolbar: search input (type=search, labelled), filter chips (All, To read, Reading, Finished) as buttons with aria-pressed, sort select with the four SORTS.
- SummaryStrip: counts text ("3 finished, 1 reading, 2 to read") and <div role="progressbar"> with aria-valuenow.
- BookList: <ul aria-live="polite">, empty state and no-match state. Use book.id as key.
- BookCard: BookCover, title (via Highlight), author (via Highlight), StatusSelect, status badge, rating (1-5, shown when finished), note field, Edit and Delete buttons (aria-label "Delete <title>"), "Find cover" button when no cover.
- BookCover: <img> with fixed width/height, loading="lazy", alt "Cover of <title>", onError fallback; placeholder tile with the title's first letter.
- Highlight: splits text into text + <mark> elements, never dangerouslySetInnerHTML.
- Toast: aria-live region with message, Undo button, close button.

STYLES (write real CSS, mobile-first, not stubs)
tokens.css: :root variables for colours, spacing scale, radii, shadows, fonts (serif titles, system sans UI), accent, status colours (to-read grey, reading amber, finished green); dark overrides under @media (prefers-color-scheme: dark) guarded with :root:not([data-theme="light"]) and again under :root[data-theme="dark"].
app.css: reset, layout (container max-width 800px), header, form (stacked on phones, one row at min-width 600px), toolbar (chips scroll horizontally on phones), summary/progress, book card (56px cover thumbnail on the left), badges, toast, empty states, .visually-hidden, :focus-visible outline, min 44px tap targets, @media (prefers-reduced-motion: reduce).

README.md: summary, run steps (npm install, npm run dev, npm run build, npm run preview, npm test), file tree with one-line purposes, the 12 acceptance criteria as checkboxes (add "Aadujeevitham" by Benyamin appears first as "To read"; empty title shows "Please enter a title"; empty author shows "Please enter an author"; search "ben" and "BEN" give the same result; status to Finished updates label and counts; refresh keeps data; newest first; delete then Undo restores; works at 375 px with no horizontal scroll; cover appears for a known book online; offline add shows placeholder; production build runs), an unchecked feature checklist by FR id, and a privacy note (data stays in the browser; only title and author go to Open Library when cover fetching is on).

DONE CHECK (then stop)
1. Run npm run build and npm test; both must pass.
2. Reply with only the final file tree and one line saying the skeleton is ready. No code dump.

---


## Prompt 4 — Changing the Stack

Based on the current stack , can you migrate from Vanilla JS to React+Js

## Prompt 5 — Implement all features

ROLE: Senior React engineer. The Book Tracker skeleton (React 18 + Vite, JavaScript) already exists. Implement ALL features by filling the stubs. Do not restructure, rename files, rename exports or change element ids/props the skeleton defined. No new dependencies. No server, no database, localStorage only.
EFFICIENCY RULES
- First, in ONE pass: list the file tree and run `grep -rn "TODO" src` to see every stub and its FR id. Do not read files one by one beyond what you must edit.
- Work in the phases below. Write each file once, in full, rather than many small patches. After each phase run `npm run build`; fix errors before continuing.
- Remove each TODO comment as you complete it. At the end, no TODO may remain.
- Keep components small and presentational. All state changes go through booksReducer. All localStorage and network code stays in src/services. Compute visible books and counts with useMemo from books + filters, never as separate state. Use book.id as the React key. Never use dangerouslySetInnerHTML.

PHASE 1: CORE (must-haves)
FR-1/2/3/4 Add form: trim inputs; Title and Author required; empty or whitespace-only shows "Please enter a title" / "Please enter an author" in the error <p> under that field, sets aria-invalid, and focuses the first invalid field. Nothing is saved on error. Status defaults to "To read". Errors clear as the user types. Enforce MAX_TITLE 200 / MAX_AUTHOR 100.
FR-5 After a successful add, clear the form and refocus the title input.
FR-6 Duplicate (same title + author, case-insensitive, trimmed): show the duplicate warning "This book is already on your list" and change the button to "Add anyway"; a second submit adds it.
FR-7/8 ADD creates {id, title, author, status, rating:0, note:"", createdAt:Date.now(), finishedAt: status==="finished" ? Date.now() : null, coverUrl:null, coverStatus:"none"}. List shows newest first by default; each card shows title, author, status label.
FR-17/18/19 StatusSelect changes status from the card; the label and counts update immediately; setting "finished" records finishedAt, any other status clears it.
FR-12/13/14 Search: case-insensitive partial match on title OR author, updates on every keystroke, trimmed query; clearing restores the list. FR-15 filter chips (All/To read/Reading/Finished) combine with search. FR-11 sort: newest (createdAt desc), oldest, title A-Z, author A-Z (localeCompare, case-insensitive). The pipeline is always: status filter, then search, then sort. Implement in selectVisibleBooks.
FR-9/10 Empty states: no books at all -> "Your shelf is empty. Add your first book!"; filters/search match nothing -> 'No books match "<query>"' (or a status-specific message when only a chip filters).
FR-16 Highlight matches in title and author with <mark> elements (escape nothing manually; split text into nodes, case-insensitive, handle regex special characters safely by not using the raw query in a RegExp).
FR-25/30 SummaryStrip: counts text like "3 finished, 1 reading, 2 to read" (omit zero parts; when total is 0 show "No books yet"), plus total, and a progress bar for percentFinished with aria-valuenow/min/max.
FR-20/21/22/23 Persistence: usePersistedBooks loads once via a lazy initialiser from storage.loadBooks (try/catch, corrupt JSON or missing storage -> [] plus a notice), saves on every books change, and shows MSG.saveError via toast if saving throws. Validate/sanitise loaded data (drop items without id/title/author, coerce status to a valid value, clamp rating 0-5). Listen to the "storage" event (onExternalChange) and replace state when another tab changes the key; make sure this cannot cause a save loop. If storage is unavailable, run in memory and show the notice.

PHASE 2: OPTIONAL EXTRAS
FR-24 Delete: capture {book, index} before dispatching DELETE; show a toast "Book deleted." with an Undo button for UNDO_MS (5000); Undo dispatches RESTORE at the original index. Only one toast at a time (a new one replaces the old; the earlier deletion simply stays committed). Clear timers on unmount. Move focus sensibly after deleting (to the next card, or the search box if the list is empty).
FR-26 Responsive: verify the layout at 375 px: no horizontal scroll, tap targets >= 44px, long unbroken titles wrap (overflow-wrap:anywhere), chips scroll horizontally.

PHASE 3: STAND-OUT FEATURES
FR-27 Edit: Edit button switches the card to inline edit (title and author inputs, Save and Cancel). Same validation and messages as the add form. Enter saves, Esc cancels, focus returns to the Edit button. Changing title or author resets coverStatus to "none" so a fresh cover lookup runs (FR-39).
FR-28 Rating: 1-5 stars as an accessible radio group (keyboard operable, aria-label "Rate N out of 5"), shown only for finished books; clicking the current rating clears it to 0.
FR-29 Note: a short optional textarea per card (max 280 chars) with a character counter, saved on blur.
FR-31 Export: button downloads `book-tracker-backup-YYYY-MM-DD.json` containing {app:"book-tracker", version:1, exportedAt, books}. Import: file input reads JSON, validates and sanitises every book exactly like load, MERGES by id (skips ids that already exist), toast "Imported N books", resets the input value so the same file can be re-imported; invalid file -> MSG.importError, state untouched.
FR-32 Theme: default follows the system; toggle cycles light/dark and persists via storage.saveTheme; set data-theme on document.documentElement. Add a tiny inline script in index.html <head> that applies the saved theme before first paint to prevent a flash.
FR-33 Shortcuts via useKeyboardShortcuts: "/" focuses the search box (ignored while typing in an input/textarea; preventDefault), Esc inside search clears it.

PHASE 4: BOOK COVERS (FR-34 to FR-41, Open Library)
- useCovers watches books with coverStatus "none" and the fetchCovers setting (default on; the Header checkbox persists it via storage.saveSettings). When off, make NO network requests.
- Process lookups ONE AT A TIME (queue), never blocking the UI. For each: coversApi.fetchCover(book) -> GET https://openlibrary.org/search.json?title=<encoded>&author=<encoded>&limit=1&fields=title,author_name,cover_i ; take cover_i from the first result; coverUrl = https://covers.openlibrary.org/b/id/<cover_i>-M.jpg. Timeout 5 s with AbortController. fetchCover never throws: on no result, no cover_i, timeout or network error it resolves {coverUrl:null}.
- Dispatch SET_COVER with {id, coverUrl, coverStatus:"found"|"missing"}. Store ONLY the URL, never image data. Each book is looked up once; no refetch on page load when status is "found" or "missing".
- Offline: if navigator.onLine is false, skip and leave "none"; resume when the window "online" event fires. Abort in-flight requests on unmount and when a book is deleted or edited. Guard against state updates after unmount and against stale results for an edited book.
- BookCover: shows the placeholder tile (first letter of title, coloured from a hash of the title) while loading, when missing, offline, or if the <img> fires onError (local state only, do not persist). <img> has fixed width/height (no layout shift), loading="lazy", alt "Cover of <title>".
- "Find cover" button on cards with coverStatus "missing": dispatches a reset to "none" to retry. Show MSG.noCover as small helper text.
- The app must work fully when the API is down or blocked: adding a book never waits on a lookup and never shows a blocking error.

PHASE 5: POLISH, A11Y, SECURITY
- Accessibility: every control has a visible label or aria-label; error text linked with aria-describedby; list and toast use aria-live="polite"; visible :focus-visible outline; AA contrast in both themes; status shown by text as well as colour; respect prefers-reduced-motion.
- Performance: wrap BookCard in React.memo, keep callbacks stable (useCallback), debounce is NOT required for search at this scale.
- Security: all user text rendered as React text nodes; sanitise imported data; no external scripts or fonts; the only network call is the cover lookup.
- Update README: mark every implemented FR as done, add known limitations (first search match may be a different edition; localStorage can be cleared so use Export).

TESTS (Vitest + React Testing Library; keep them fast)
- booksReducer: ADD, SET_STATUS (finishedAt set/cleared), DELETE + RESTORE at index, SET_COVER, IMPORT merge by id.
- selectors: search is case-insensitive over title and author ("ben" and "BEN" match "Benyamin"); filter + search + sort pipeline; newest-first default; selectCounts incl. percentFinished.
- validate: empty, whitespace-only, too long.
- AddBookForm component test: empty title shows "Please enter a title"; valid add shows the book at the top with "To read".
- storage: corrupt JSON returns [] without throwing.

ACCEPTANCE CHECK (must all hold; cover with tests where possible)
1 Add "Aadujeevitham" by Benyamin, To read -> top of list, label "To read". 2 Empty title -> "Please enter a title" under the title box, nothing saved. 3 Empty author -> "Please enter an author". 4 Search "ben" and "BEN" -> only matching books. 5 Change status to Finished -> label and counts update. 6 Refresh -> data persists. 7 Second book appears above the first. 8 Delete then Undo restores it in place. 9 At 375 px: no horizontal scroll. 10 With internet: cover appears for a well-known book; offline: book still adds with a placeholder. 11 Corrupt localStorage value -> app loads with an empty list and a notice. 12 `npm run build` and `npm test` both pass.

DONE CHECK (then stop)
Run `npm run build`, `npm test`, and `grep -rn "TODO" src` (must be empty). Reply with ONLY: a short list of FR ids completed, anything you deliberately changed or could not do (with the reason), and the commands to run the app. No code dump.

---

