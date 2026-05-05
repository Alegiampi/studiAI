import { useState, useEffect, useCallback } from 'react'
import getCroppedImg from '@/utils/cropImage'
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
  onGoToExplanation: () => void,
  showToast?: (msg: string, type: 'error' | 'success' | 'info') => void
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
  const handleFile = useCallback(async (file: File) => {
    if (!file || !file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    
    try {
      // Ottimizziamo l'immagine caricata (resize e compressione)
      // Carichiamo l'immagine per avere le dimensioni originali per il "crop" totale
      const img = new Image()
      img.src = url
      await new Promise((resolve) => { img.onload = resolve })

      const { url: optimizedUrl, base64 } = await getCroppedImg(
        url,
        { x: 0, y: 0, width: img.width, height: img.height },
        0
      )
      setInput(prev => ({ ...prev, image: optimizedUrl, imageBase64: base64 }))
    } catch (e) {
      console.error('Errore ottimizzazione immagine:', e)
      // Fallback
      const reader = new FileReader()
      reader.onload = (e) => {
        const base64 = (e.target?.result as string).split(',')[1]
        setInput(prev => ({ ...prev, image: url, imageBase64: base64 }))
      }
      reader.readAsDataURL(file)
    }
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

    if (!explainRes.ok) {
      setExerciseState(prev => ({ ...prev, loading: false }))
      showToast?.('Errore nel contattare il tutor. Riprova tra poco.', 'error')
      return
    }

    const explainData = await explainRes.json()
    if (explainData.explanation?.startsWith('Errore')) {
      setExerciseState(prev => ({ ...prev, loading: false }))
      showToast?.(explainData.explanation.slice(0, 100), 'error')
      return
    }

    let detectedTipo = 'Altro'

    if (classifyRes) {
      const classifyData = await classifyRes.json()
      setExerciseState(prev => ({
        ...prev,
        explanation: explainData.explanation,
        loading: false,
        graficoUtile: classifyData.graficoUtile ?? false,
        chatMessages: [{ role: 'assistant' as const, text: "Ciao! Ho analizzato l'esercizio e preparato la spiegazione passo-passo. Se c'è qualcosa che non ti è chiaro o vuoi approfondire un punto specifico, chiedimi pure!" }]
      }))
      if (classifyData.tipo) detectedTipo = classifyData.tipo
    } else {
      setExerciseState(prev => ({
        ...prev,
        explanation: explainData.explanation,
        loading: false,
        graficoUtile: false,
        chatMessages: [{ role: 'assistant' as const, text: "Ciao! Ho analizzato l'esercizio e preparato la spiegazione passo-passo. Se c'è qualcosa che non ti è chiaro o vuoi approfondire un punto specifico, chiedimi pure!" }]
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
          title: 'Spiegazione theLemma',
          text: 'Guarda questa spiegazione passo-passo su theLemma!',
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
    try {
      const res = await fetch('/api/graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ esercizio: exerciseState.exercise?.text || '', spiegazione: exerciseState.explanation })
      })
      if (!res.ok) {
        showToast?.('Errore generazione grafico. Riprova.', 'error')
        setExerciseState(prev => ({ ...prev, graficoLoading: false }))
        return
      }
      const data = await res.json()
      if (data.data) {
        setExerciseState(prev => ({ ...prev, grafico: data.data, graficoLoading: false }))
      } else {
        showToast?.('Nessun grafico disponibile per questo esercizio.', 'info')
        setExerciseState(prev => ({ ...prev, graficoLoading: false }))
      }
    } catch (e) {
      showToast?.('Errore di connessione. Riprova.', 'error')
      setExerciseState(prev => ({ ...prev, graficoLoading: false }))
    }
  }, [exerciseState.exercise, exerciseState.explanation, showToast])

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
      if (!res.ok) {
        showToast?.('Errore nella chat. Riprova.', 'error')
        setExerciseState(prev => ({ ...prev, chatLoading: false }))
        return
      }
      const data = await res.json()
      if (data.reply) {
        setExerciseState(prev => ({
          ...prev,
          chatMessages: [...prev.chatMessages, { role: 'user' as const, text: messageText }, { role: 'assistant' as const, text: data.reply }],
          chatLoading: false,
        }))
      } else {
        showToast?.('Risposta non ricevuta. Riprova.', 'error')
        setExerciseState(prev => ({ ...prev, chatLoading: false }))
      }
    } catch (e) {
      console.error(e)
      showToast?.('Errore di connessione. Controlla la rete.', 'error')
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
