import { describe, expect, it } from 'vitest'

import { booksReducer, createInitialState, initialState } from './booksReducer.js'

const reduce = (state, type, payload) => booksReducer(state, { type, payload })
const addBook = (state, payload) => reduce(state, 'ADD', payload)

const aadujeevitham = { title: 'Aadujeevitham', author: 'Benyamin', status: 'to-read' }

describe('booksReducer', () => {
  it('initialState has an empty shelf and default filters', () => {
    expect(initialState.books).toEqual([])
    expect(initialState.filters).toEqual({ status: 'all', query: '', sort: 'newest' })
  })

  it('ADD appends a book with a generated id and the requested status', () => {
    const state = addBook(createInitialState([]), aadujeevitham)
    expect(state.books).toHaveLength(1)

    const book = state.books[0]
    expect(book.id).toBeTruthy()
    expect(book.title).toBe('Aadujeevitham')
    expect(book.author).toBe('Benyamin')
    expect(book.status).toBe('to-read')
    expect(book.rating).toBe(0)
    expect(book.note).toBe('')
    expect(typeof book.createdAt).toBe('number')
    expect(book.finishedAt).toBeNull()
    expect(book.coverUrl).toBeNull()
    expect(book.coverStatus).toBe('none')
  })

  it('ADD stamps finishedAt when the book is created as finished', () => {
    const state = addBook(createInitialState([]), { ...aadujeevitham, status: 'finished' })
    expect(typeof state.books[0].finishedAt).toBe('number')
  })

  it('ADD trims the fields and saves nothing when one is blank', () => {
    const trimmed = addBook(createInitialState([]), {
      title: '  Aadujeevitham  ',
      author: '  Benyamin ',
    })
    expect(trimmed.books[0].title).toBe('Aadujeevitham')
    expect(trimmed.books[0].author).toBe('Benyamin')

    const blankTitle = addBook(createInitialState([]), { title: '   ', author: 'Benyamin' })
    expect(blankTitle.books).toHaveLength(0)

    const blankAuthor = addBook(createInitialState([]), { title: 'Aadujeevitham', author: '' })
    expect(blankAuthor.books).toHaveLength(0)
  })

  it('ADD ignores a duplicate title + author pair unless allowDuplicate is set', () => {
    const once = addBook(createInitialState([]), aadujeevitham)
    const twice = addBook(once, aadujeevitham)
    expect(twice.books).toHaveLength(1)

    const caseInsensitive = addBook(once, { title: '  AADUJEEVITHAM ', author: 'benyamin' })
    expect(caseInsensitive.books).toHaveLength(1)

    const confirmed = addBook(once, { ...aadujeevitham, allowDuplicate: true })
    expect(confirmed.books).toHaveLength(2)
  })

  it('SET_STATUS stamps finishedAt when finished and clears it otherwise', () => {
    const created = addBook(createInitialState([]), aadujeevitham)
    const id = created.books[0].id

    const finished = reduce(created, 'SET_STATUS', { id, status: 'finished' })
    expect(finished.books[0].status).toBe('finished')
    expect(typeof finished.books[0].finishedAt).toBe('number')

    const reading = reduce(finished, 'SET_STATUS', { id, status: 'reading' })
    expect(reading.books[0].status).toBe('reading')
    expect(reading.books[0].finishedAt).toBeNull()
  })

  it('UPDATE merges a patch and resets the cover when the identity changes', () => {
    const created = addBook(createInitialState([]), aadujeevitham)
    const id = created.books[0].id
    const withCover = reduce(created, 'SET_COVER', {
      id,
      coverUrl: 'https://covers.openlibrary.org/b/id/1-M.jpg',
      coverStatus: 'found',
    })

    const retitled = reduce(withCover, 'UPDATE', { id, patch: { title: 'Aadujeevitham 2' } })
    expect(retitled.books[0].title).toBe('Aadujeevitham 2')
    expect(retitled.books[0].coverUrl).toBeNull()
    expect(retitled.books[0].coverStatus).toBe('none')

    const noted = reduce(retitled, 'UPDATE', { id, patch: { note: 'Great read', rating: 4 } })
    expect(noted.books[0].note).toBe('Great read')
    expect(noted.books[0].rating).toBe(4)
  })

  it('DELETE removes a book and RESTORE puts it back at its index', () => {
    let state = createInitialState([])
    state = addBook(state, { title: 'A', author: 'One' })
    state = addBook(state, { title: 'B', author: 'Two' })
    state = addBook(state, { title: 'C', author: 'Three' })

    const removed = state.books[1]
    const afterDelete = reduce(state, 'DELETE', { id: removed.id })
    expect(afterDelete.books.map((book) => book.title)).toEqual(['A', 'C'])

    const restored = reduce(afterDelete, 'RESTORE', { book: removed, index: 1 })
    expect(restored.books.map((book) => book.title)).toEqual(['A', 'B', 'C'])
  })

  it('SET_COVER stores the url and status', () => {
    const created = addBook(createInitialState([]), aadujeevitham)
    const id = created.books[0].id

    const found = reduce(created, 'SET_COVER', {
      id,
      coverUrl: 'https://covers.openlibrary.org/b/id/240726-M.jpg',
      coverStatus: 'found',
    })
    expect(found.books[0].coverUrl).toBe('https://covers.openlibrary.org/b/id/240726-M.jpg')
    expect(found.books[0].coverStatus).toBe('found')

    const missing = reduce(created, 'SET_COVER', { id, coverUrl: null, coverStatus: 'missing' })
    expect(missing.books[0].coverUrl).toBeNull()
    expect(missing.books[0].coverStatus).toBe('missing')

    const reset = reduce(missing, 'SET_COVER', { id, coverUrl: null, coverStatus: 'none' })
    expect(reset.books[0].coverStatus).toBe('none')
  })

  it('SET_COVER ignores a stale result for an edited book', () => {
    const created = addBook(createInitialState([]), aadujeevitham)
    const id = created.books[0].id
    const stale = reduce(created, 'SET_COVER', {
      id,
      coverUrl: 'https://covers.openlibrary.org/b/id/1-M.jpg',
      coverStatus: 'found',
      match: 'some other book\u0000someone else',
    })
    expect(stale.books[0].coverUrl).toBeNull()
  })

  it('IMPORT merges by id and skips ids that already exist', () => {
    const created = addBook(createInitialState([]), aadujeevitham)
    const existing = created.books[0]
    const incoming = [
      existing,
      {
        id: 'imported-1',
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        status: 'finished',
        rating: 5,
        note: '',
        createdAt: 10,
        finishedAt: 20,
        coverUrl: null,
        coverStatus: 'missing',
      },
      { id: 'broken' },
    ]

    const merged = reduce(created, 'IMPORT', { books: incoming })
    expect(merged.books).toHaveLength(2)
    expect(merged.books.map((book) => book.id)).toEqual([existing.id, 'imported-1'])
    expect(merged.books[1].status).toBe('finished')
  })

  it('HYDRATE replaces the shelf and drops unusable entries', () => {
    const state = reduce(initialState, 'HYDRATE', {
      books: [{ ...aadujeevitham, id: '1' }, { author: 'nobody' }],
    })
    expect(state.books).toHaveLength(1)
    expect(state.books[0].title).toBe('Aadujeevitham')
  })

  it('SET_FILTER validates status and sort values', () => {
    const filtered = reduce(initialState, 'SET_FILTER', {
      query: 'ben',
      status: 'nonsense',
      sort: 'author-az',
    })
    expect(filtered.filters).toEqual({ query: 'ben', status: 'all', sort: 'author-az' })
  })

  it('unknown actions return state unchanged', () => {
    expect(reduce(initialState, '__unknown__')).toBe(initialState)
  })
})
