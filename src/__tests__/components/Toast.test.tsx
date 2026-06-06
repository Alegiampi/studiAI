import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ToastContainer from '@/components/Toast'
import type { Toast } from '@/types'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
      const rest = { ...props }
      delete rest.initial
      delete rest.animate
      delete rest.exit
      delete rest.transition
      delete rest.layout
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

afterEach(cleanup)

describe('ToastContainer', () => {
  it('renders nothing when toasts array is empty', () => {
    const { container } = render(<ToastContainer toasts={[]} removeToast={vi.fn()} />)
    expect(container.textContent).toBe('')
  })

  it('renders a toast message', () => {
    const toasts: Toast[] = [{ id: 1, message: 'Hello World', type: 'info' }]
    render(<ToastContainer toasts={toasts} removeToast={vi.fn()} />)
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })

  it('renders error toast', () => {
    const toasts: Toast[] = [{ id: 1, message: 'Error occurred', type: 'error' }]
    render(<ToastContainer toasts={toasts} removeToast={vi.fn()} />)
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
  })

  it('renders success toast', () => {
    const toasts: Toast[] = [{ id: 1, message: 'Success!', type: 'success' }]
    render(<ToastContainer toasts={toasts} removeToast={vi.fn()} />)
    expect(screen.getByText('Success!')).toBeInTheDocument()
  })

  it('calls removeToast on dismiss button click', () => {
    const removeToast = vi.fn()
    const toasts: Toast[] = [{ id: 42, message: 'Dismiss me', type: 'info' }]
    render(<ToastContainer toasts={toasts} removeToast={removeToast} />)

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(removeToast).toHaveBeenCalledWith(42)
  })

  it('renders multiple toasts', () => {
    const toasts: Toast[] = [
      { id: 1, message: 'First', type: 'info' },
      { id: 2, message: 'Second', type: 'success' },
    ]
    render(<ToastContainer toasts={toasts} removeToast={vi.fn()} />)
    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })
})
