import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App.jsx'
import { BooksProvider } from './context/BooksContext.jsx'
import { MSG, SETTINGS_KEY, STORAGE_KEY } from './utils/constants.js'

const coversOff = () =>
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ fetchCovers: false }))

const renderApp = () =>
  render(
    <BooksProvider>
      <App />
    </BooksProvider>,
  )

const addBook = (title, author) => {
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: title } })
  fireEvent.change(screen.getByLabelText('Author'), { target: { value: author } })
  fireEvent.click(screen.getByRole('button', { name: 'Add' }))
}

const titles = () =>
  screen.getAllByRole('listitem').map((item) => item.querySelector('.book-card__title').textContent)

beforeEach(() => {
  window.localStorage.clear()
  coversOff()
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('network disabled in tests'))),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('keeps the books after a reload', () => {
    const first = renderApp()
    addBook('Aadujeevitham', 'Benyamin')
    expect(titles()).toEqual(['Aadujeevitham'])

    first.unmount()
    renderApp()

    expect(titles()).toEqual(['Aadujeevitham'])
    expect(screen.getByText('Aadujeevitham')).toBeTruthy()
  })

  it('restores a deleted book in place when Undo is pressed', () => {
    renderApp()
    addBook('A', 'One')
    addBook('B', 'Two')
    addBook('C', 'Three')
    expect(titles()).toEqual(['C', 'B', 'A'])

    fireEvent.click(screen.getByRole('button', { name: 'Delete B' }))
    expect(titles()).toEqual(['C', 'A'])
    expect(screen.getByText(MSG.deleted)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: MSG.undo }))
    expect(titles()).toEqual(['C', 'B', 'A'])
  })

  it('starts empty with a notice when the stored value is corrupt', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{definitely not json')

    renderApp()

    expect(await screen.findByText(MSG.loadError)).toBeTruthy()
    expect(screen.getByText(/Your shelf is empty/)).toBeTruthy()
  })

  it('adds the book and keeps the placeholder when the cover lookup fails', async () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ fetchCovers: true }))

    renderApp()
    addBook('Aadujeevitham', 'Benyamin')

    // Adding never waits for the lookup.
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Aadujeevitham')).toBeTruthy()

    const placeholder = screen.getByRole('listitem').querySelector('.book-cover--placeholder')
    expect(placeholder).toBeTruthy()
    expect(placeholder.textContent).toBe('A')

    // The miss is reported as helper text, never as a blocking error.
    expect(await screen.findByText(MSG.noCover)).toBeTruthy()
    expect(screen.queryByText(MSG.saveError)).toBeNull()
  })

  it('shows the cover when the lookup succeeds', async () => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ fetchCovers: true }))
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ docs: [{ cover_i: 42 }] }),
        }),
      ),
    )

    renderApp()
    addBook('Aadujeevitham', 'Benyamin')

    const image = await screen.findByAltText('Cover of Aadujeevitham', {}, { timeout: 2000 })
    expect(image.getAttribute('src')).toBe('https://covers.openlibrary.org/b/id/42-M.jpg')
    expect(image.getAttribute('width')).toBe('56')
    expect(image.getAttribute('loading')).toBe('lazy')
  })

  it('marks matches in the title and author without touching innerHTML', () => {
    renderApp()
    addBook('Aadujeevitham', 'Benyamin')

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'ben' } })

    const item = screen.getByRole('listitem')
    const marked = within(item).getAllByText('Ben', { exact: false })
    expect(marked.every((node) => node.tagName === 'MARK')).toBe(true)
  })
})
