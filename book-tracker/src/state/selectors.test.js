import { describe, expect, it } from 'vitest'

import { selectCounts, selectVisibleBooks } from './selectors.js'

const makeBook = (overrides) => ({
  id: 'x',
  title: 'Untitled',
  author: 'Nobody',
  status: 'to-read',
  rating: 0,
  note: '',
  createdAt: 0,
  finishedAt: null,
  coverUrl: null,
  coverStatus: 'none',
  ...overrides,
})

const benyamin = makeBook({
  id: '1',
  title: 'Aadujeevitham',
  author: 'Benyamin',
  status: 'to-read',
  createdAt: 300,
})

const coelho = makeBook({
  id: '2',
  title: 'The Alchemist',
  author: 'Paulo Coelho',
  status: 'finished',
  rating: 5,
  createdAt: 100,
  finishedAt: 500,
  coverStatus: 'missing',
})

const rowling = makeBook({
  id: '3',
  title: 'Harry Potter',
  author: 'J. K. Rowling',
  status: 'reading',
  createdAt: 200,
})

const books = [benyamin, coelho, rowling]

describe('selectVisibleBooks', () => {
  it('defaults to newest first', () => {
    const visible = selectVisibleBooks(books, { status: 'all', query: '', sort: 'newest' })
    expect(visible.map((book) => book.id)).toEqual(['1', '3', '2'])
  })

  it('sorts oldest first on request', () => {
    const visible = selectVisibleBooks(books, { status: 'all', sort: 'oldest' })
    expect(visible.map((book) => book.id)).toEqual(['2', '3', '1'])
  })

  it('sorts by title A-Z and by author A-Z, case-insensitively', () => {
    const byTitle = selectVisibleBooks(books, { status: 'all', sort: 'title-az' })
    expect(byTitle.map((book) => book.title)).toEqual([
      'Aadujeevitham',
      'Harry Potter',
      'The Alchemist',
    ])

    const byAuthor = selectVisibleBooks(books, { sort: 'author-az' })
    expect(byAuthor.map((book) => book.author)).toEqual([
      'Benyamin',
      'J. K. Rowling',
      'Paulo Coelho',
    ])
  })

  it('search is case-insensitive over title and author', () => {
    const lower = selectVisibleBooks(books, { status: 'all', query: 'ben' })
    const upper = selectVisibleBooks(books, { status: 'all', query: 'BEN' })

    expect(lower.map((book) => book.id)).toEqual(['1'])
    expect(upper.map((book) => book.id)).toEqual(['1'])

    const byTitle = selectVisibleBooks(books, { status: 'all', query: 'alchemist' })
    expect(byTitle.map((book) => book.id)).toEqual(['2'])
  })

  it('trims the query and restores everything when it is cleared', () => {
    expect(selectVisibleBooks(books, { query: '   ' })).toHaveLength(3)
    expect(selectVisibleBooks(books, { query: '' })).toHaveLength(3)
  })

  it('runs status filter, then search, then sort', () => {
    const visible = selectVisibleBooks(books, { status: 'to-read', query: 'ben', sort: 'title-az' })
    expect(visible.map((book) => book.id)).toEqual(['1'])

    const noMatch = selectVisibleBooks(books, { status: 'finished', query: 'ben' })
    expect(noMatch).toEqual([])

    const reading = selectVisibleBooks(books, { status: 'reading' })
    expect(reading.map((book) => book.id)).toEqual(['3'])
  })

  it('never mutates the input array', () => {
    const snapshot = books.map((book) => book.id)
    selectVisibleBooks(books, { sort: 'oldest' })
    expect(books.map((book) => book.id)).toEqual(snapshot)
  })
})

describe('selectCounts', () => {
  it('returns total, per-status counts and percent finished', () => {
    expect(selectCounts(books)).toEqual({
      total: 3,
      toRead: 1,
      reading: 1,
      finished: 1,
      percentFinished: 33,
    })
  })

  it('reports 0 percent for an empty shelf', () => {
    expect(selectCounts([])).toEqual({
      total: 0,
      toRead: 0,
      reading: 0,
      finished: 0,
      percentFinished: 0,
    })
  })

  it('reports 100 percent when everything is finished', () => {
    expect(selectCounts([coelho]).percentFinished).toBe(100)
  })
})
