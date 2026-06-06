import { StateCreator } from 'zustand'
import { createClient } from '@/lib/supabase'
import getCroppedImg from '@/utils/cropImage'
import { copyToClipboard } from '@/utils/clipboard'
import { parseExplanation } from '@/lib/utils'
import { GraficoData, ToastType } from '@/types'
import type { AuthSlice } from './authSlice'
import type { ProfileSlice } from './profileSlice'
import type { UsageSlice } from './usageSlice'

const supabase = createClient()

interface AppRouter {
  push: (href: string) => void
  replace: (href: string) => void
}

export type ExerciseInput = {
  text: string
  imageBase64?: string
  imagePreview?: string
}

export type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
}

export interface ExerciseSlice {
  inputText: string
  inputImage: string | null
  inputImageBase64: string | null
  setInputText: (text: string) => void
  setInputImage: (image: string | null) => void
  setInputImageBase64: (base64: string | null) => void
  handleFile: (file: File) => Promise<void>

  exercise: ExerciseInput | null
  explanation: string
  loading: boolean
  graficoUtile: boolean | null
  grafico: GraficoData | null
  graficoLoading: boolean
  shareUrl: string | null
  shareLoading: boolean
  currentExerciseId: number | null
  chatMessages: ChatMessage[]
  chatLoading: boolean
  quoteIndex: number
  isFavorite: boolean

  rotateQuote: () => void
  handleSubmit: (router: AppRouter, showToast: (msg: string, type: ToastType) => void) => Promise<void>
  handleShare: (showToast: (msg: string, type: ToastType) => void) => Promise<void>
  handleGrafico: (showToast: (msg: string, type: ToastType) => void) => Promise<void>
  handleChatSubmit: (messageText: string, showToast: (msg: string, type: ToastType) => void) => Promise<void>
  resetExercise: () => void
  loadExerciseById: (id: string | number, showToast: (msg: string, type: ToastType) => void) => Promise<void>
  toggleFavorite: (showToast: (msg: string, type: ToastType) => void) => Promise<void>
}

export type StoreApi = AuthSlice & ProfileSlice & UsageSlice & ExerciseSlice

export const createExerciseSlice: StateCreator<StoreApi, [], [], ExerciseSlice> = (set, get) => ({
  inputText: '',
  inputImage: null,
  inputImageBase64: null,
  setInputText: (text) => set({ inputText: text }),
  setInputImage: (image) => set({ inputImage: image }),
  setInputImageBase64: (base64) => set({ inputImageBase64: base64 }),
  handleFile: async (file) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)

    try {
      const img = new Image()
      img.src = url
      await new Promise((resolve) => { img.onload = resolve })

      const { url: optimizedUrl, base64 } = await getCroppedImg(
        url,
        { x: 0, y: 0, width: img.width, height: img.height },
        0
      )
      set({ inputImage: optimizedUrl, inputImageBase64: base64 })
    } catch (e) {
      console.error('Errore ottimizzazione immagine:', e)
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(',')[1]
        set({ inputImage: url, inputImageBase64: base64 })
      }
      reader.readAsDataURL(file)
    }
  },

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
  quoteIndex: Math.floor(Math.random() * 6),
  isFavorite: false,

  rotateQuote: () => set((state) => ({ quoteIndex: (state.quoteIndex + 1) % 6 })),

  handleSubmit: async (router: AppRouter, showToast) => {
    const { isLimited, inputText, inputImage, inputImageBase64, profilo, user } = get()

    if (isLimited) {
      router.push('/paywall')
      return
    }

    if (!inputText.trim() && !inputImage) return

    set({
      exercise: { text: inputText, imageBase64: inputImageBase64 || undefined, imagePreview: inputImage || undefined },
      explanation: '',
      loading: true,
      graficoUtile: null,
      grafico: null,
      graficoLoading: false,
      shareUrl: null,
      shareLoading: false,
      currentExerciseId: null,
      chatMessages: [],
      chatLoading: false,
    })

    router.push('/explain')

    try {
      const [explainRes, classifyRes] = await Promise.all([
        fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: inputText,
            imageBase64: inputImageBase64 || undefined,
            tipo: 'esercizio',
            scuola: profilo.scuola || undefined,
            classe: profilo.classe || undefined,
            materie: profilo.materie || undefined
          })
        }),
        inputText.trim() ? fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: inputText,
            scuola: profilo.scuola || undefined,
            classe: profilo.classe || undefined
          })
        }) : Promise.resolve(null)
      ])

      if (!explainRes.ok) {
        set({ loading: false })
        let errMsg = 'Errore nel contattare il tutor. Riprova tra poco.'
        try {
          const errData = await explainRes.json()
          if (errData.explanation) {
            errMsg = errData.explanation
          } else if (errData.error) {
            errMsg = errData.error
          }
        } catch {
          // Fallback a errore generico se non è JSON valido
        }
        showToast(errMsg, 'error')
        router.push('/home')
        return
      }

      let detectedTipo = 'Altro'
      let isGraphUseful = false
      if (classifyRes && classifyRes.ok) {
        try {
          const classifyData = await classifyRes.json()
          isGraphUseful = classifyData.graficoUtile ?? false
          if (classifyData.tipo) detectedTipo = classifyData.tipo
        } catch (e) {
          console.error('Errore nel parsing di classify:', e)
        }
      }
      set({ graficoUtile: isGraphUseful })

      const welcomeChatMsg: ChatMessage = {
        role: 'assistant',
        text: "Ciao! Ho preparato la spiegazione passo-passo. Se hai dubbi su un punto specifico, clicca sul pulsante **'Dubbi?'** che trovi su ogni passaggio per chiedermi chiarimenti immediati, oppure scrivimi pure qui!"
      }

      let accumulatedText = ''
      const contentType = explainRes.headers.get('Content-Type') || ''

      if (contentType.includes('application/json')) {
        const explainData = await explainRes.json()
        if (explainData.explanation?.startsWith('Errore')) {
          set({ loading: false })
          showToast(explainData.explanation.slice(0, 100), 'error')
          router.push('/home')
          return
        }
        accumulatedText = explainData.explanation
        set({
          explanation: accumulatedText,
          loading: false,
          chatMessages: [welcomeChatMsg]
        })
      } else {
        const reader = explainRes.body?.getReader()
        if (!reader) {
          throw new Error('Corpo della risposta non leggibile.')
        }

        const decoder = new TextDecoder()
        let hasContent = false

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          accumulatedText += decoder.decode(value, { stream: true })

          if (!hasContent) {
            const parsed = parseExplanation(accumulatedText, true)
            if (parsed.titolo || parsed.passi.length > 0) {
              hasContent = true
              set({ loading: false, chatMessages: [welcomeChatMsg] })
            }
          }

          set({ explanation: accumulatedText })
        }

        set({ loading: false })
        if (!hasContent) {
          set({ chatMessages: [welcomeChatMsg] })
        }
      }

      // Se l'esercizio è stato caricato tramite immagine, non abbiamo eseguito la classificazione.
      // Eseguiamola ora usando il titolo o il testo della spiegazione.
      if (!inputText.trim()) {
        try {
          const parsed = parseExplanation(accumulatedText)
          const textToClassify = parsed.titolo || parsed.finale || accumulatedText
          const classifyRes = await fetch('/api/classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: textToClassify,
              scuola: profilo.scuola || undefined,
              classe: profilo.classe || undefined
            })
          })
          if (classifyRes.ok) {
            const classifyData = await classifyRes.json()
            isGraphUseful = classifyData.graficoUtile ?? false
            if (classifyData.tipo) detectedTipo = classifyData.tipo
            set({ graficoUtile: isGraphUseful })
          }
        } catch (e) {
          console.error('Errore classificazione post-spiegazione per immagine:', e)
        }
      }

      // Salva esercizio nel db se l'utente è loggato
      if (user) {
        const dbRes = await fetch('/api/exercises', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: inputText, explanation: accumulatedText, subject: detectedTipo })
        }).then(r => r.json())

        if (dbRes.data?.id) {
          set({ currentExerciseId: dbRes.data.id })
          router.replace(`/explain/${dbRes.data.id}`)
        }
      }
    } catch (error) {
      console.error(error)
      set({ loading: false })
      showToast('Si è verificato un errore inaspettato.', 'error')
      router.push('/home')
    }
  },

  handleShare: async (showToast) => {
    const { exercise, explanation, grafico, profilo } = get()
    set({ shareLoading: true })

    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: exercise?.text || '',
          explanation: explanation,
          scuola: profilo.scuola,
          classe: profilo.classe,
          grafico: grafico
        })
      })

      if (!res.ok) throw new Error('Errore API share')

      const data = await res.json()
      const url = window.location.origin + '/s/' + data.id

      await copyToClipboard(url)
      set({ shareUrl: url, shareLoading: false })

      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Spiegazione theLemma',
            text: 'Guarda questa spiegazione passo-passo su theLemma!',
            url: url
          })
        } catch {
          // L'utente ha annullato
        }
      }

      setTimeout(() => set({ shareUrl: null }), 3000)
    } catch (err) {
      console.error('Errore durante la condivisione:', err)
      showToast('Errore durante la condivisione. Riprova.', 'error')
      set({ shareLoading: false })
    }
  },

  handleGrafico: async (showToast) => {
    const { exercise, explanation } = get()
    set({ graficoLoading: true })

    try {
      const res = await fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ esercizio: exercise?.text || '', spiegazione: explanation })
      })

      if (!res.ok) {
        showToast('Errore generazione grafico. Riprova.', 'error')
        set({ graficoLoading: false })
        return
      }

      const data = await res.json()
      if (data.data) {
        set({ grafico: data.data, graficoLoading: false })
      } else {
        showToast(data.error || 'Nessun grafico disponibile per questo esercizio.', 'info')
        set({ graficoLoading: false })
      }
    } catch {
      showToast('Errore di connessione. Riprova.', 'error')
      set({ graficoLoading: false })
    }
  },

  handleChatSubmit: async (messageText, showToast) => {
    if (!messageText.trim()) return
    const { chatMessages, exercise, explanation } = get()

    const newMessages = [...chatMessages, { role: 'user' as const, text: messageText }]
    set({
      chatMessages: newMessages,
      chatLoading: true,
    })

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          exercise: exercise?.text,
          explanation: explanation
        })
      })

      if (!res.ok) {
        showToast('Errore nella chat. Riprova.', 'error')
        set({ chatLoading: false })
        return
      }

      const data = await res.json()
      if (data.reply) {
        set({
          chatMessages: [...newMessages, { role: 'assistant', text: data.reply }],
          chatLoading: false,
        })
      } else {
        showToast('Risposta non ricevuta. Riprova.', 'error')
        set({ chatLoading: false })
      }
    } catch (e) {
      console.error(e)
      showToast('Errore di connessione. Controlla la rete.', 'error')
      set({ chatLoading: false })
    }
  },

  resetExercise: () => set({
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
    isFavorite: false,
  }),

  loadExerciseById: async (id, showToast) => {
    set({ loading: true, graficoLoading: false, chatLoading: false, grafico: null, chatMessages: [] })
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        showToast('Esercizio non trovato o non autorizzato.', 'error')
        set({ loading: false })
        return
      }

      // Determina se il grafico è utile
      let isGraphUseful = false
      const usefulSubjects = ['derivata', 'integrale', 'funzione', 'geometria_analitica', 'trigonometria', 'limite']
      if (data.subject && usefulSubjects.includes(data.subject.toLowerCase())) {
        isGraphUseful = true
      } else {
        try {
          const parsed = parseExplanation(data.explanation)
          const textToClassify = data.question || parsed.titolo || parsed.finale || data.explanation || ''
          const classifyRes = await fetch('/api/classify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToClassify })
          })
          if (classifyRes.ok) {
            const classifyData = await classifyRes.json()
            isGraphUseful = classifyData.graficoUtile ?? false
          }
        } catch (e) {
          console.error('Errore classificazione storico:', e)
        }
      }

      set({
        exercise: { text: data.question },
        explanation: data.explanation,
        currentExerciseId: Number(id),
        loading: false,
        isFavorite: data.is_favorite ?? false,
        graficoUtile: isGraphUseful,
        chatMessages: [{
          role: 'assistant',
          text: "Ciao! Questo è un esercizio caricato dal tuo storico. Come posso aiutarti con i passaggi di questa spiegazione?"
        }]
      })
    } catch (err) {
      console.error(err)
      showToast('Errore durante il recupero dell\'esercizio.', 'error')
      set({ loading: false })
    }
  },

  toggleFavorite: async (showToast) => {
    const { currentExerciseId, isFavorite } = get()
    if (!currentExerciseId) return

    const newFav = !isFavorite
    set({ isFavorite: newFav })
    showToast(newFav ? 'Aggiunto ai preferiti!' : 'Rimosso dai preferiti', 'success')

    try {
      const res = await fetch('/api/exercises', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentExerciseId, is_favorite: newFav })
      })
      if (!res.ok) throw new Error('Server error')
    } catch (err) {
      set({ isFavorite })
      showToast('Errore salvataggio preferito', 'error')
      console.error('Error toggling favorite:', err)
    }
  },
})
