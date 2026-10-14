import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_SETTINGS, MSG, STORAGE_KEY } from '../utils/constants.js'
import { isAvailable, loadBooks, loadBooksWithNotice, loadSettings, saveBooks } from './storage.js'

const validBook = {
  id: '1',
  title: 'Aadujeevitham',
  author: 'Benyamin',
  status: 'to-read',
  rating: 0,
  note: '',
  createdAt: 1,
  finishedAt: null,
  coverUrl: null,
  coverStatus: 'none',
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('storage', () => {
  it('reports storage as available in a normal browser', () => {
    expect(isAvailable()).toBe(true)
  })

  it('returns [] for corrupt JSON without throwing', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not valid json')

    expect(() => loadBooks()).not.toThrow()
    expect(loadBooks()).toEqual([])

    const report = loadBooksWithNotice()
    expect(report.books).toEqual([])
    expect(report.notice).toBe(MSG.loadError)
  })

  it('returns [] and no notice when nothing is stored yet', () => {
    expect(loadBooksWithNotice()).toEqual({ books: [], notice: '' })
  })

  it('drops unusable entries and sanitises the rest', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        validBook,
        { title: 'missing id', author: 'someone' },
        { ...validBook, id: '2', title: 'Other', author: 'Someone', status: 'bogus', rating: 9 },
      ]),
    )

    const { books, notice } = loadBooksWithNotice()
    expect(notice).toBe('')
    expect(books.map((book) => book.id)).toEqual(['1', '2'])
    expect(books[1].status).toBe('to-read')
    expect(books[1].rating).toBe(5)
  })

  it('round-trips saved books', () => {
    expect(saveBooks([validBook])).toBe(true)
    expect(loadBooks()).toHaveLength(1)
    expect(loadBooks()[0].title).toBe('Aadujeevitham')
  })

  it('falls back to the default settings for junk', () => {
    window.localStorage.setItem('bookTracker.settings', '{{{')
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })
})
