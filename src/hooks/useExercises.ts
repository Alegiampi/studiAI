import { useState, useEffect, useCallback } from 'react'
import { GraficoData } from '@/types'

type ExerciseInput = {
  text: string
  imageBase64?: string
  imagePreview?: string
}

type ChatMessage = {
  role: 'user' | 'assistant'
  text: string
}

type Profilo = {
  scuola?: string
  classe?: string
  materie?: string[]
}

type ExerciseState = {
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
}

type InputState = {
  text: string
  image: string | null
  imageBase64: string | null
}

export function useExercises(
  user: any,
  profilo: Profilo,
  incrementUsage: () => void,
  isLimited: boolean,
  onGoToPaywall: () => void,
  onGoToExplanation: () => void
) {
  const [input, setInput] = useState<InputState>({
    text: '',
    image: null,
    imageBase64: null,
  })

  const [exerciseState, setExerciseState] = useState<ExerciseState>({
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
  })

  // Rotazione delle frasi motivazionali
  const [quoteIndex, setQuoteIndex] = useState(() => Math.floor(Math.random() * 6))

  useEffect(() => {
    if (!exerciseState.loading) return
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % 6)
    }, 3000)
    return () => clearInterval(interval)
  }, [exerciseState.loading])

  function setText(text: string) {
    setInput(prev => ({ ...prev, text }))
  }

  function setImage(image: string | null) {
    setInput(prev => ({ ...prev, image }))
  }

  function setImageBase64(imageBase64: string | null) {
    setInput(prev => ({ ...prev, imageBase64 }))
  }

  // Gestione file immagine
  const handleFile = useCallback((file: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const preview = URL.createObjectURL(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      const base64 = (e.target?.result as string).split(',')[1]
      setInput(prev => ({ ...prev, image: preview, imageBase64: base64 }))
    }
    reader.readAsDataURL(file)
  }, [])

  // Submit dell'esercizio
  const handleSubmit = useCallback(async () => {
    if (isLimited) {
      onGoToPaywall()
      return
    }
    if (!input.text.trim() && !input.image) return

    // Incrementa il contatore degli utilizzi
    incrementUsage()

    // Vai alla schermata di spiegazione e imposta loading in un singolo setState
    setExerciseState({
      exercise: { text: input.text, imageBase64: input.imageBase64 || undefined, imagePreview: input.image || undefined },
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
    onGoToExplanation()

    // Chiama le API in parallelo: spiegazione + classificazione
    const [explainRes, classifyRes] = await Promise.all([
      fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.text, imageBase64: input.imageBase64, tipo: 'esercizio', scuola: profilo.scuola, classe: profilo.classe, materie: profilo.materie })
      }),
      input.text.trim() ? fetch('/api/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.text, scuola: profilo.scuola, classe: profilo.classe })
      }) : Promise.resolve(null)
    ])

    const explainData = await explainRes.json()
    let detectedTipo = 'Altro'

    if (classifyRes) {
      const classifyData = await classifyRes.json()
      setExerciseState(prev => ({
        ...prev,
        explanation: explainData.explanation,
        loading: false,
        graficoUtile: classifyData.graficoUtile ?? false,
      }))
      if (classifyData.tipo) detectedTipo = classifyData.tipo
    } else {
      setExerciseState(prev => ({
        ...prev,
        explanation: explainData.explanation,
        loading: false,
        graficoUtile: false,
      }))
    }

    // Salva l'esercizio nel database se l'utente è loggato
    if (user) {
      fetch('/api/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: input.text, explanation: explainData.explanation, subject: detectedTipo })
      }).then(r => r.json()).then(d => {
        if (d.data?.id) {
          setExerciseState(prev => ({ ...prev, currentExerciseId: d.data.id }))
        }
      })
    }
  }, [input, isLimited, incrementUsage, onGoToPaywall, onGoToExplanation, profilo, user])

  // Condivisione della spiegazione
  const handleShare = useCallback(async () => {
    setExerciseState(prev => ({ ...prev, shareLoading: true }))
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: exerciseState.exercise?.text || '',
        explanation: exerciseState.explanation,
        scuola: profilo.scuola,
        classe: profilo.classe,
        grafico: exerciseState.grafico
      })
    })
    const data = await res.json()
    const url = window.location.origin + '/s/' + data.id

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Spiegazione StudiAI',
          text: 'Guarda questa spiegazione passo-passo su StudiAI!',
          url: url
        })
        setExerciseState(prev => ({ ...prev, shareLoading: false }))
        return
      } catch (err) {
        try { await navigator.clipboard.writeText(url) } catch {}
      }
    } else {
      try { await navigator.clipboard.writeText(url) } catch {}
    }

    setExerciseState(prev => ({ ...prev, shareUrl: url, shareLoading: false }))
    setTimeout(() => setExerciseState(prev => ({ ...prev, shareUrl: null })), 3000)
  }, [exerciseState.exercise, exerciseState.explanation, exerciseState.grafico, profilo])

  // Generazione del grafico
  const handleGrafico = useCallback(async () => {
    setExerciseState(prev => ({ ...prev, graficoLoading: true }))
    const res = await fetch('/api/graph', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ esercizio: exerciseState.exercise?.text || '', spiegazione: exerciseState.explanation })
    })
    const data = await res.json()
    if (data.data) {
      console.log('Grafico:', JSON.stringify(data.data))
      setExerciseState(prev => ({ ...prev, grafico: data.data, graficoLoading: false }))
    } else {
      setExerciseState(prev => ({ ...prev, graficoLoading: false }))
    }
    if (data.error) console.log('Grafico error:', data.error)
  }, [exerciseState.exercise, exerciseState.explanation])

  // Chat con il tutor
  const handleChatSubmit = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return

    setExerciseState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, { role: 'user' as const, text: messageText }],
      chatLoading: true,
    }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...exerciseState.chatMessages, { role: 'user' as const, text: messageText }],
          exercise: exerciseState.exercise?.text,
          explanation: exerciseState.explanation
        })
      })
      const data = await res.json()
      if (data.reply) {
        setExerciseState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages, { role: 'user' as const, text: messageText }, { role: 'assistant' as const, text: data.reply }],
          chatLoading: false,
        }))
      }
    } catch (e) {
      console.error(e)
      setExerciseState(prev => ({ ...prev, chatLoading: false }))
    }
  }, [exerciseState.chatMessages, exerciseState.exercise, exerciseState.explanation])

  // Reset di tutti gli stati dell'esercizio
  const resetExercise = useCallback(() => {
    setInput({ text: '', image: null, imageBase64: null })
    setExerciseState({
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
    })
  }, [])

  return {
    text: input.text,
    setText,
    image: input.image,
    setImage,
    imageBase64: input.imageBase64,
    setImageBase64,
    ...exerciseState,
    quoteIndex,
    handleFile,
    handleSubmit,
    handleShare,
    handleGrafico,
    handleChatSubmit,
    resetExercise,
  }
}
