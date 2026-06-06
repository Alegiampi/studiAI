import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@test.com' } },
        error: null,
      }),
    },
  }),
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

vi.stubEnv('OPENAI_API_KEY', 'sk-test-key')

const { POST } = await import('@/app/api/classify/route')

function createMockRequest(body: Record<string, unknown>) {
  return {
    json: vi.fn().mockResolvedValue(body),
  } as unknown as NextRequest
}

describe('POST /api/classify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns graficoUtile=true for function-type exercises', async () => {
    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '{"graficoUtile":true,"tipo":"funzione"}' } }],
      }),
    })

    const req = createMockRequest({
      text: 'Studia la funzione f(x) = x^3 - 3x',
      scuola: 'Liceo Scientifico',
      classe: '5A',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(data).toEqual({ graficoUtile: true, tipo: 'funzione' })
  })

  it('returns graficoUtile=false for algebra exercises', async () => {
    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '{"graficoUtile":false,"tipo":"algebra"}' } }],
      }),
    })

    const req = createMockRequest({
      text: 'Risolvi 2x + 3 = 7',
      scuola: 'Liceo Scientifico',
      classe: '2A',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(data).toEqual({ graficoUtile: false, tipo: 'algebra' })
  })

  it('falls back to default on parse error', async () => {
    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'not valid json' } }],
      }),
    })

    const req = createMockRequest({
      text: 'Spiega la fisica quantistica',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(data).toEqual({ graficoUtile: false, tipo: 'altro' })
  })

  it('falls back to default when choices is empty', async () => {
    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({
        choices: [{}],
      }),
    })

    const req = createMockRequest({
      text: 'Test',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(data).toEqual({ graficoUtile: false, tipo: 'altro' })
  })

  it('uses Groq when OPENAI_API_KEY is not set', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    mockFetch.mockResolvedValueOnce({
      json: vi.fn().mockResolvedValue({
        choices: [{ message: { content: '{"graficoUtile":true,"tipo":"derivata"}' } }],
      }),
    })

    const req = createMockRequest({
      text: 'Derivata di sin(x)',
    })

    const res = await POST(req)
    const data = await res.json()

    expect(data).toEqual({ graficoUtile: true, tipo: 'derivata' })
    vi.stubEnv('OPENAI_API_KEY', 'sk-test-key')
  })
})
