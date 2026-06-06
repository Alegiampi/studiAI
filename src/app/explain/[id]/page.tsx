'use client'

import { useParams } from 'next/navigation'
import { useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { useToast } from '@/hooks/ToastContext'
import ExplanationScreen from '@/components/screens/ExplanationScreen'
import { Loader2 } from 'lucide-react'

export default function ExplainDetailPage() {
  const params = useParams()
  const id = params?.id
  const { loadExerciseById, currentExerciseId, loading } = useStore()
  const { showToast } = useToast()

  useEffect(() => {
    if (id) {
      loadExerciseById(id as string, showToast)
    }
  }, [id, loadExerciseById, showToast])

  if (loading && currentExerciseId !== Number(id)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 size={40} className="text-primary animate-spin mb-4" />
        <div className="text-foreground-muted font-medium text-sm animate-pulse">
          Caricamento esercizio...
        </div>
      </div>
    )
  }

  return <ExplanationScreen />
}
