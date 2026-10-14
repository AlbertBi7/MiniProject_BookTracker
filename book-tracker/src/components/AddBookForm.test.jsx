import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import App from '../App.jsx'
import { BooksProvider } from '../context/BooksContext.jsx'
import { MSG, SETTINGS_KEY } from '../utils/constants.js'

const renderApp = () =>
  render(
    <BooksProvider>
      <App />
    </BooksProvider>,
  )

const fill = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

beforeEach(() => {
  window.localStorage.clear()
  // Covers off so the component tests never touch the network.
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({ fetchCovers: false }))
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.reject(new Error('network disabled in tests'))),
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('AddBookForm', () => {
  it('shows "Please enter a title" and saves nothing when the title is empty', () => {
    renderApp()

    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    // Both required fields error; the title message sits under the title box.
    const titleError = document.getElementById('book-title-error')
    expect(titleError.textContent).toBe(MSG.titleRequired)
    expect(titleError.getAttribute('role')).toBe('alert')
    expect(screen.getByText(MSG.authorRequired)).toBeTruthy()
    expect(screen.getByLabelText('Title').getAttribute('aria-invalid')).toBe('true')
    expect(screen.getByLabelText('Title').getAttribute('aria-describedby')).toBe('book-title-error')
    expect(screen.getByText(/Your shelf is empty/)).toBeTruthy()
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })

  it('shows "Please enter an author" when only the author is missing', () => {
    renderApp()

    fill('Title', 'Aadujeevitham')
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    expect(screen.getByRole('alert').textContent).toBe(MSG.authorRequired)
    expect(screen.getByLabelText('Author').getAttribute('aria-invalid')).toBe('true')
  })

  it('adds a valid book at the top as "To read" and refocuses the title input', () => {
    renderApp()

    fill('Title', 'Aadujeevitham')
    fill('Author', 'Benyamin')
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(1)
    expect(within(items[0]).getByText('Aadujeevitham')).toBeTruthy()
    expect(within(items[0]).getByText('Benyamin')).toBeTruthy()
    expect(within(items[0]).getByText('To read', { selector: '.badge' })).toBeTruthy()

    const titleInput = screen.getByLabelText('Title')
    expect(titleInput.value).toBe('')
    expect(document.activeElement).toBe(titleInput)
  })

  it('warns about a duplicate, then adds it with "Add anyway"', () => {
    renderApp()

    const add = () => {
      fill('Title', 'Aadujeevitham')
      fill('Author', 'Benyamin')
      fireEvent.click(screen.getByRole('button', { name: /Add/ }))
    }

    add()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)

    add()
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByRole('alert').textContent).toBe(MSG.duplicate)

    fireEvent.click(screen.getByRole('button', { name: MSG.addAnyway }))
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('filters the list case-insensitively and updates status labels and counts', () => {
    renderApp()

    fill('Title', 'Aadujeevitham')
    fill('Author', 'Benyamin')
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    fill('Title', 'The Alchemist')
    fill('Author', 'Paulo Coelho')
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))

    // Second book is newer, so it sits on top.
    expect(within(screen.getAllByRole('listitem')[0]).getByText('The Alchemist')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: 'BEN' } })
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Aadujeevitham')).toBeTruthy()

    fireEvent.change(screen.getByLabelText('Search'), { target: { value: '' } })
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    fireEvent.change(screen.getByLabelText('Status for Aadujeevitham'), {
      target: { value: 'finished' },
    })
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('50')

    fireEvent.click(screen.getByRole('button', { name: 'Reading' }))
    expect(screen.getByText(/No books marked/)).toBeTruthy()
  })
})
