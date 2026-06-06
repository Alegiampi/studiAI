import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import RouteGuard from '@/components/RouteGuard'

const mockReplace = vi.fn()
const mockUsePathname = vi.fn().mockReturnValue('/home')

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => mockUsePathname(),
}))

vi.mock('@/store/useStore', () => ({
  useStore: vi.fn(),
}))

vi.mock('lucide-react', () => ({
  Loader2: ({ className }: { className?: string }) => <div data-testid="loader" className={className} />,
}))

import { useStore } from '@/store/useStore'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('RouteGuard', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/home')
  })

  it('shows loader when authLoading and not public route', () => {
    vi.mocked(useStore).mockReturnValue({
      user: null,
      authLoading: true,
      showOnboarding: false,
      showPersonalizzazione: false,
      initAuth: vi.fn().mockReturnValue(vi.fn()),
    })

    render(<RouteGuard><div>Protected Content</div></RouteGuard>)
    expect(screen.getByTestId('loader')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('does not show loader on public routes even when authLoading', () => {
    mockUsePathname.mockReturnValue('/s/some-share')
    vi.mocked(useStore).mockReturnValue({
      user: null,
      authLoading: true,
      showOnboarding: false,
      showPersonalizzazione: false,
      initAuth: vi.fn().mockReturnValue(vi.fn()),
    })

    render(<RouteGuard><div>Shared Content</div></RouteGuard>)
    expect(screen.queryByTestId('loader')).not.toBeInTheDocument()
    expect(screen.getByText('Shared Content')).toBeInTheDocument()
  })

  it('redirects to login when not authenticated on private route', () => {
    vi.mocked(useStore).mockReturnValue({
      user: null,
      authLoading: false,
      showOnboarding: false,
      showPersonalizzazione: false,
      initAuth: vi.fn().mockReturnValue(vi.fn()),
    })

    render(<RouteGuard><div>Protected Content</div></RouteGuard>)
    expect(mockReplace).toHaveBeenCalledWith('/')
  })

  it('renders children when authenticated', () => {
    vi.mocked(useStore).mockReturnValue({
      user: { id: '123' },
      authLoading: false,
      showOnboarding: false,
      showPersonalizzazione: false,
      initAuth: vi.fn().mockReturnValue(vi.fn()),
    })

    render(<RouteGuard><div>Protected Content</div></RouteGuard>)
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects to onboarding when showOnboarding is true', () => {
    vi.mocked(useStore).mockReturnValue({
      user: { id: '123' },
      authLoading: false,
      showOnboarding: true,
      showPersonalizzazione: false,
      initAuth: vi.fn().mockReturnValue(vi.fn()),
    })

    render(<RouteGuard><div>Protected Content</div></RouteGuard>)
    expect(mockReplace).toHaveBeenCalledWith('/onboarding')
  })
})
