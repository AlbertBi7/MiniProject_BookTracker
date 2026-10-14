import { describe, expect, it } from 'vitest'

import { MAX_AUTHOR, MAX_TITLE, MSG } from './constants.js'
import { duplicateKey, findDuplicate, sanitizeBook, validateBook } from './validate.js'

describe('validateBook', () => {
  it('requires a title and an author', () => {
    const empty = validateBook({})
    expect(empty.valid).toBe(false)
    expect(empty.errors.title).toBe(MSG.titleRequired)
    expect(empty.errors.author).toBe(MSG.authorRequired)
  })

  it('rejects whitespace-only fields', () => {
    const blank = validateBook({ title: '   ', author: '\t\n ' })
    expect(blank.valid).toBe(false)
    expect(blank.errors.title).toBe(MSG.titleRequired)
    expect(blank.errors.author).toBe(MSG.authorRequired)
  })

  it('accepts trimmed values within the limits', () => {
    expect(validateBook({ title: '  Aadujeevitham ', author: ' Benyamin ' })).toEqual({
      valid: true,
      errors: {},
    })
  })

  it('rejects values longer than the limits', () => {
    const long = validateBook({
      title: 'a'.repeat(MAX_TITLE + 1),
      author: 'b'.repeat(MAX_AUTHOR + 1),
    })
    expect(long.valid).toBe(false)
    expect(long.errors.title).toBe(MSG.titleTooLong)
    expect(long.errors.author).toBe(MSG.authorTooLong)

    expect(validateBook({ title: 'a'.repeat(MAX_TITLE), author: 'b'.repeat(MAX_AUTHOR) }).valid).toBe(
      true,
    )
  })
})

describe('duplicateKey / findDuplicate', () => {
  it('ignores case and surrounding whitespace', () => {
    expect(duplicateKey(' Aadujeevitham ', 'BENYAMIN')).toBe(duplicateKey('aadujeevitham', ' Benyamin '))
  })

  it('finds an existing pair and can skip the book being edited', () => {
    const books = [{ id: '1', title: 'Aadujeevitham', author: 'Benyamin' }]
    expect(findDuplicate(books, 'aadujeevitham', 'benyamin')).toBe(true)
    expect(findDuplicate(books, 'Aadujeevitham', 'Benyamin', '1')).toBe(false)
    expect(findDuplicate(books, 'Other', 'Someone')).toBe(false)
  })
})

describe('sanitizeBook', () => {
  it('drops entries without an id, title or author', () => {
    expect(sanitizeBook(null)).toBeNull()
    expect(sanitizeBook('nope')).toBeNull()
    expect(sanitizeBook({ title: 'A', author: 'B' })).toBeNull()
    expect(sanitizeBook({ id: '1', author: 'B' })).toBeNull()
  })

  it('coerces the status, clamps the rating and keeps valid covers', () => {
    const book = sanitizeBook({
      id: '1',
      title: 'Aadujeevitham',
      author: 'Benyamin',
      status: 'nonsense',
      rating: 99,
      createdAt: 'nope',
      coverUrl: 'https://covers.openlibrary.org/b/id/1-M.jpg',
      coverStatus: 'found',
    })

    expect(book.status).toBe('to-read')
    expect(book.rating).toBe(5)
    expect(typeof book.createdAt).toBe('number')
    expect(book.coverStatus).toBe('found')
    expect(book.finishedAt).toBeNull()
  })

  it('nulls an unsafe cover url', () => {
    const book = sanitizeBook({
      id: '1',
      title: 'A',
      author: 'B',
      coverUrl: 'javascript:alert(1)',
      coverStatus: 'found',
    })
    expect(book.coverUrl).toBeNull()
    expect(book.coverStatus).toBe('none')
  })
})
