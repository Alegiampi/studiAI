import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { User } from '@supabase/supabase-js'

vi.mock('@/lib/supabase', () => ({
  createClient: () => ({
    auth: {
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      refreshSession: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  }),
}))

import { useStore } from '@/store/useStore'

describe('useStore', () => {
  beforeEach(() => {
    useStore.setState({
      user: null,
      authLoading: true,
      inputText: '',
      inputImage: null,
      inputImageBase64: null,
      exercise: null,
      explanation: '',
      loading: false,
      graficoUtile: null,
      grafico: null,
      graficoLoading: false,
      shareUrl: null,
      shareLoading: false,
      currentExerciseId: null,
      chatMessages: [],
      chatLoading: false,
      quoteIndex: 0,
      isFavorite: false,
      profilo: {},
      isPremium: false,
      showOnboarding: false,
      showPersonalizzazione: false,
      usedToday: 0,
      remaining: 5,
      isLimited: false,
    })
  })

  describe('Auth actions', () => {
    it('setSession sets user', () => {
      const mockUser = { id: '123', email: 'test@test.com' }
      useStore.getState().setSession(mockUser as unknown as User)
      expect(useStore.getState().user).toEqual(mockUser)
    })

    it('setAuthLoading sets loading state', () => {
      useStore.getState().setAuthLoading(false)
      expect(useStore.getState().authLoading).toBe(false)
    })
  })

  describe('Profile actions', () => {
    it('setProfilo sets profile', () => {
      const profile = { scuola: 'Liceo', classe: '5A', materie: ['matematica'] }
      useStore.getState().setProfilo(profile)
      expect(useStore.getState().profilo).toEqual(profile)
    })

    it('setIsPremium sets premium status', () => {
      useStore.getState().setIsPremium(true)
      expect(useStore.getState().isPremium).toBe(true)
    })

    it('setShowOnboarding toggles onboarding', () => {
      useStore.getState().setShowOnboarding(true)
      expect(useStore.getState().showOnboarding).toBe(true)
    })
  })

  describe('Input actions', () => {
    it('setInputText updates text', () => {
      useStore.getState().setInputText('Calcola la derivata')
      expect(useStore.getState().inputText).toBe('Calcola la derivata')
    })

    it('setInputImage updates image', () => {
      useStore.getState().setInputImage('blob:url')
      expect(useStore.getState().inputImage).toBe('blob:url')
    })

    it('setInputImageBase64 updates base64', () => {
      useStore.getState().setInputImageBase64('base64data')
      expect(useStore.getState().inputImageBase64).toBe('base64data')
    })
  })

  describe('resetExercise', () => {
    it('resets all exercise-related state', () => {
      useStore.setState({
        inputText: 'test',
        inputImage: 'blob:url',
        inputImageBase64: 'base64',
        exercise: { text: 'test', imageBase64: 'base64' },
        explanation: 'spiegazione',
        loading: true,
        graficoUtile: true,
        grafico: { boundingBox: [0, 0, 10, 10], espressioni: [] },
        graficoLoading: true,
        shareUrl: 'http://example.com',
        shareLoading: true,
        currentExerciseId: 42,
        chatMessages: [{ role: 'user', text: 'ciao' }],
        chatLoading: true,
        isFavorite: true,
      })

      useStore.getState().resetExercise()

      const state = useStore.getState()
      expect(state.inputText).toBe('')
      expect(state.inputImage).toBeNull()
      expect(state.inputImageBase64).toBeNull()
      expect(state.exercise).toBeNull()
      expect(state.explanation).toBe('')
      expect(state.loading).toBe(false)
      expect(state.graficoUtile).toBeNull()
      expect(state.grafico).toBeNull()
      expect(state.graficoLoading).toBe(false)
      expect(state.shareUrl).toBeNull()
      expect(state.shareLoading).toBe(false)
      expect(state.currentExerciseId).toBeNull()
      expect(state.chatMessages).toEqual([])
      expect(state.chatLoading).toBe(false)
      expect(state.isFavorite).toBe(false)
    })
  })

  describe('rotateQuote', () => {
    it('cycles through quotes 0-5', () => {
      useStore.setState({ quoteIndex: 0 })
      useStore.getState().rotateQuote()
      expect(useStore.getState().quoteIndex).toBe(1)

      useStore.setState({ quoteIndex: 5 })
      useStore.getState().rotateQuote()
      expect(useStore.getState().quoteIndex).toBe(0)
    })
  })
})
