'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import ToastContainer from '@/components/Toast'
import { Toast, ToastType } from '@/types'

export interface ToastContextType {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType) => void
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: number) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

let nextId = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = nextId++
    
    setToasts(prev => {
      // Se il messaggio riguarda i preferiti, rimuoviamo i toast precedenti dello stesso argomento
      // per evitare l'accumulo (spam) mostrato nello screenshot.
      if (message.toLowerCase().includes('preferiti')) {
        return [...prev.filter(t => !t.message.toLowerCase().includes('preferiti')), { id, message, type }]
      }
      return [...prev, { id, message, type }]
    })

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    showToast(message, type)
  }, [showToast])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const value: ToastContextType = {
    toasts,
    showToast,
    addToast,
    removeToast
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
