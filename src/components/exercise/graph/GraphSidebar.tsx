'use client'

import { useState } from 'react'
import { Eye, EyeOff, TrendingUp, Plus, Check, X, Pencil, Trash2, Bot, Loader2, Minus, MoreHorizontal, PanelLeftClose, PanelLeftOpen, Sparkles } from 'lucide-react'
import { compile } from 'mathjs'
import { motion, AnimatePresence } from 'framer-motion'

interface UserFunction {
  type: 'function' | 'point'
  fn?: string
  coords?: [number, number]
  color: string
  label?: string
}

interface ExpressionItem {
  type: string
  fn?: string
  coords?: [number, number]
  color: string
  label?: string
  domain?: [number, number]
  interactive?: boolean
  isUser: boolean
  userIdx?: number
}

interface GraphSidebarProps {
  allEspressioni: ExpressionItem[];
  userFunctions: UserFunction[];
  setUserFunctions: React.Dispatch<React.SetStateAction<UserFunction[]>>;
  hiddenIndices: Set<number>;
  setHiddenIndices: React.Dispatch<React.SetStateAction<Set<number>>>;
  showTangent: boolean;
  setShowTangent: (val: boolean) => void;
  customColors: Record<number, string>;
  setCustomColors: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  customStyles: Record<number, 'solid' | 'dashed'>;
  setCustomStyles: React.Dispatch<React.SetStateAction<Record<number, 'solid' | 'dashed'>>>;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function GraphSidebar({
  allEspressioni,
  userFunctions,
  setUserFunctions,
  hiddenIndices,
  setHiddenIndices,
  showTangent,
  setShowTangent,
  customColors,
  setCustomColors,
  customStyles,
  setCustomStyles,
  collapsed = false,
  onToggleCollapse
}: GraphSidebarProps) {
  const [isAddingMode, setIsAddingMode] = useState(false)
  const [newFunctionInput, setNewFunctionInput] = useState('')
  const [inputError, setInputError] = useState(false)
  
  const [isAIAssistMode, setIsAIAssistMode] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isAILoading, setIsAILoading] = useState(false)
  const [aiError, setAiError] = useState(false)
  
  const [editingUserIdx, setEditingUserIdx] = useState<number | null>(null)
  const [editInput, setEditInput] = useState('')

  const handleAddFunction = (sanitized: string) => {
    const randomColors = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899']
    const color = randomColors[userFunctions.length % randomColors.length]
    setUserFunctions(prev => [...prev, { type: 'function', fn: sanitized, color }])
    setNewFunctionInput('')
    setIsAddingMode(false)
    setInputError(false)
  }

  const handleAIAssist = async (prompt: string) => {
    if (!prompt.trim() || isAILoading) return
    setIsAILoading(true)
    setAiError(false)
    try {
      const res = await fetch('/api/graph/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, context: allEspressioni })
      })
      if (!res.ok) throw new Error('Errore API')
      const newElements = await res.json()
      setUserFunctions(prev => [
        ...prev,
        ...newElements.map((el: { type: 'function' | 'point'; fn?: string; coords?: [number, number]; color?: string; label?: string }) => ({
          type: el.type,
          fn: el.fn,
          coords: el.coords,
          color: el.color || '#F59E0B',
          label: el.label
        }))
      ])
      setAiPrompt('')
      setIsAIAssistMode(false)
    } catch {
      setAiError(true)
    } finally {
      setIsAILoading(false)
    }
  }

  const toggleHidden = (i: number) => {
    setHiddenIndices(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  // Collapsed mode: horizontal on mobile, vertical bar on desktop
  if (collapsed) {
    return (
      <motion.div 
        layout
        className="flex flex-row md:flex-col items-center justify-between md:justify-start w-full md:w-12 shrink-0 h-12 md:h-full relative bg-surface/20 backdrop-blur-md border-t md:border-t-0 md:border-r border-surface-border/50 overflow-hidden px-4 md:px-0 py-0 md:py-3 transition-all duration-300"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Expand button at top/left */}
        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-hover transition-all"
          title="Espandi sidebar"
        >
          <PanelLeftOpen size={15} className="rotate-90 md:rotate-0" />
        </button>
        <div className="hidden md:block w-8 h-px bg-surface-border/50 my-2" />

        {/* Color dots (scrollable horizontally on mobile, stacked vertically on desktop) */}
        <div className="flex-1 flex flex-row md:flex-col items-center justify-start md:justify-center gap-3 overflow-x-auto md:overflow-x-visible scrollbar-hide py-1 md:py-3 px-2 md:px-0">
          {allEspressioni.map((e, i) => {
            const isHidden = hiddenIndices.has(i)
            const displayColor = customColors[i] || e.color
            return (
              <div key={i} className="relative group/dot shrink-0">
                <button
                  onClick={() => toggleHidden(i)}
                  className="w-[18px] h-[18px] rounded-full border border-surface-border/80 flex items-center justify-center transition-all hover:scale-110 shrink-0"
                  style={{
                    backgroundColor: isHidden ? 'transparent' : displayColor,
                    borderColor: displayColor,
                    opacity: isHidden ? 0.35 : 1
                  }}
                />
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 md:bottom-auto md:left-8 md:top-1/2 md:-translate-y-1/2 bg-surface/90 border border-surface-border text-foreground text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg backdrop-blur-sm">
                  {e.label}
                </div>
              </div>
            )
          })}
        </div>

        {allEspressioni.length > 0 && <div className="hidden md:block w-8 h-px bg-surface-border/50 my-2" />}

        {/* Action icons */}
        <div className="flex flex-row md:flex-col items-center gap-1.5 md:gap-2">
          <button
            onClick={() => setShowTangent(!showTangent)}
            className={`p-1.5 rounded-lg transition-all ${showTangent ? 'text-yellow-400 bg-yellow-400/10' : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'}`}
            title={showTangent ? 'Nascondi tangente' : 'Mostra tangente'}
          >
            <TrendingUp size={15} />
          </button>

          <div className="relative">
            <button
              onClick={() => setIsAddingMode(!isAddingMode)}
              className={`p-1.5 rounded-lg transition-all ${isAddingMode ? 'text-success bg-success/10' : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'}`}
              title="Aggiungi funzione"
            >
              <Plus size={15} />
            </button>
            <AnimatePresence>
              {isAddingMode && (
                <motion.form
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!newFunctionInput.trim()) return
                    const sanitized = newFunctionInput.trim().toLowerCase().replace(/(sin|cos|tan|log|ln|exp|sqrt|abs)x/g, '$1(x)')
                    try { compile(sanitized); handleAddFunction(sanitized) } catch { setInputError(true) }
                  }}
                  className="absolute bottom-10 right-0 md:bottom-auto md:right-auto md:left-9 md:-top-1 bg-surface/95 border border-surface-border rounded-xl p-2.5 flex items-center gap-1.5 z-50 shadow-2xl backdrop-blur-md min-w-[160px]"
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-success shrink-0" />
                  <input 
                    autoFocus 
                    value={newFunctionInput} 
                    onChange={(e) => { setNewFunctionInput(e.target.value); setInputError(false) }} 
                    placeholder="es. sin(x)" 
                    className="bg-transparent border-none outline-none text-xs text-foreground w-28 placeholder:text-foreground-subtle font-mono" 
                  />
                  <button type="submit" className="text-foreground-muted hover:text-success"><Check size={14} /></button>
                  <button type="button" onClick={() => { setIsAddingMode(false); setNewFunctionInput(''); setInputError(false) }} className="text-foreground-muted hover:text-danger"><X size={14} /></button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsAIAssistMode(!isAIAssistMode)}
              className={`p-1.5 rounded-lg transition-all ${isAIAssistMode ? 'text-primary bg-primary/10' : 'text-foreground-muted hover:text-foreground hover:bg-surface-hover'}`}
              title="Chiedi all'IA"
            >
              <Sparkles size={15} />
            </button>
            <AnimatePresence>
              {isAIAssistMode && (
                <motion.form
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onSubmit={(e) => { e.preventDefault(); if (isAILoading) return; handleAIAssist(aiPrompt) }}
                  className="absolute bottom-10 right-0 md:bottom-auto md:right-auto md:left-9 md:-top-1 bg-surface/95 border border-primary/20 rounded-xl p-2.5 flex items-center gap-1.5 z-50 shadow-2xl backdrop-blur-md min-w-[180px]"
                >
                  {isAILoading ? (
                    <Loader2 size={14} className="text-primary animate-spin shrink-0" />
                  ) : (
                    <Sparkles size={14} className="text-primary shrink-0 animate-pulse" />
                  )}
                  <input 
                    autoFocus 
                    value={aiPrompt} 
                    onChange={(e) => { setAiPrompt(e.target.value); setAiError(false) }} 
                    disabled={isAILoading} 
                    placeholder="es. Asse parabola" 
                    className="bg-transparent border-none outline-none text-xs text-foreground w-32 placeholder:text-foreground-subtle" 
                  />
                  {!isAILoading && (
                    <>
                      <button type="submit" className="text-foreground-muted hover:text-primary"><Check size={14} /></button>
                      <button type="button" onClick={() => { setIsAIAssistMode(false); setAiPrompt(''); setAiError(false) }} className="text-foreground-muted hover:text-danger"><X size={14} /></button>
                    </>
                  )}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    )
  }

  // Expanded mode: bottom panel on mobile, vertical panel on desktop
  return (
    <motion.div 
      layout
      className="flex flex-col w-full md:w-64 shrink-0 h-[200px] md:h-full bg-surface/15 backdrop-blur-md border-t md:border-t-0 md:border-r border-surface-border/50 overflow-hidden transition-all duration-300"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header with title + collapse button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border/50 bg-surface/10 shrink-0">
        <span className="text-[10px] font-black text-foreground-muted uppercase tracking-widest">Elementi Grafico</span>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-active transition-all shrink-0"
          title="Collassa sidebar"
        >
          <PanelLeftClose size={15} className="rotate-90 md:rotate-0" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-3 py-2.5 scrollbar-hide">
        {/* Tangent toggle */}
        <button
          onClick={() => setShowTangent(!showTangent)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all w-full text-left border shrink-0
            ${showTangent 
              ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20 shadow-sm' 
              : 'text-foreground-muted hover:text-foreground bg-surface/20 border-surface-border/30 hover:bg-surface-hover hover:border-surface-border/60'
            }`}
        >
          <TrendingUp size={14} className={showTangent ? 'opacity-100' : 'opacity-60'} />
          <span>{showTangent ? 'Tangente attiva' : 'Mostra tangente'}</span>
          <div className={`ml-auto w-1.5 h-1.5 rounded-full transition-colors ${showTangent ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]' : 'bg-surface-border'}`} />
        </button>

        {allEspressioni.length > 0 && (
          <div className="h-px bg-surface-border/40 my-0.5 shrink-0" />
        )}

        {/* Element list */}
        <div className="flex flex-col gap-1">
          <AnimatePresence initial={false}>
            {allEspressioni.map((e, i) => {
              const isHidden = hiddenIndices.has(i)
              const displayColor = customColors[i] || e.color
              const defaultStyle = (e.type === 'derivative' || e.label?.toLowerCase().includes('asintoto')) ? 'dashed' : 'solid'
              const displayStyle = customStyles[i] || defaultStyle

              return (
                <motion.div 
                  key={i} 
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  className="group/item flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-surface/10 hover:bg-surface-hover/30 border border-transparent hover:border-surface-border/30 transition-all"
                >
                  {editingUserIdx === e.userIdx && e.isUser && e.type === 'function' ? (
                    <form 
                      onSubmit={(evt) => {
                        evt.preventDefault()
                        if (!editInput.trim()) return
                        const sanitized = editInput.trim().toLowerCase().replace(/(sin|cos|tan|log|ln|exp|sqrt|abs)x/g, '$1(x)')
                        try {
                          compile(sanitized)
                          setUserFunctions(prev => prev.map((f, idx) => idx === e.userIdx ? { ...f, fn: sanitized } : f))
                          setEditingUserIdx(null)
                        } catch {}
                      }}
                      className="flex-1 flex items-center gap-1.5"
                    >
                      <input 
                        autoFocus 
                        value={editInput} 
                        onChange={ev => setEditInput(ev.target.value)} 
                        className="bg-background/80 border border-primary/30 outline-none text-xs text-foreground w-full px-2 py-1 rounded-lg focus:border-primary/60 transition-all font-mono" 
                      />
                      <button type="submit" className="text-success hover:scale-110 transition-transform"><Check size={14} /></button>
                      <button type="button" onClick={() => setEditingUserIdx(null)} className="text-danger hover:scale-110 transition-transform"><X size={14} /></button>
                    </form>
                  ) : (
                    <>
                      {/* Color Picker Swatch */}
                      <div className="relative shrink-0 w-5 h-5 rounded-full border border-surface-border/80 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 group/color">
                        <div 
                          className={`w-3 h-3 rounded-full transition-all ${isHidden ? 'scale-75 opacity-40' : ''}`}
                          style={{ backgroundColor: displayColor }}
                        />
                        <input
                          type="color"
                          value={displayColor}
                          onChange={(evt) => setCustomColors(prev => ({ ...prev, [i]: evt.target.value }))}
                          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                          title="Cambia colore"
                        />
                      </div>
                      
                      {/* Element Label */}
                      <span className={`text-[12px] flex-1 truncate transition-all ${isHidden ? 'text-foreground-subtle/50 line-through' : 'text-foreground/90'}`}>
                        {e.type === 'function' || e.type === 'derivative' ? (
                          <code className="font-mono text-[11px] bg-background/50 border border-surface-border/30 px-1.5 py-0.5 rounded text-foreground/80">
                            {e.label}
                          </code>
                        ) : (
                          e.label
                        )}
                      </span>

                      {/* Hover controls */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        {(e.type === 'function' || e.type === 'derivative') && (
                          <button 
                            onClick={(evt) => { evt.stopPropagation(); setCustomStyles(prev => ({ ...prev, [i]: displayStyle === 'solid' ? 'dashed' : 'solid' })) }}
                            className="p-1 rounded-lg hover:bg-surface-hover border border-transparent hover:border-surface-border text-foreground-muted hover:text-foreground transition-colors"
                            title={displayStyle === 'solid' ? 'Usa linea tratteggiata' : 'Usa linea continua'}
                          >
                            {displayStyle === 'solid' ? <Minus size={13} /> : <MoreHorizontal size={13} />}
                          </button>
                        )}
                        {e.isUser && (
                          <>
                            {e.type === 'function' && (
                              <button 
                                onClick={(evt) => { evt.stopPropagation(); setEditingUserIdx(e.userIdx ?? null); setEditInput(e.fn || '') }} 
                                className="p-1 rounded-lg hover:bg-surface-hover border border-transparent hover:border-surface-border text-foreground-muted hover:text-foreground transition-colors" 
                                title="Modifica espressione"
                              >
                                <Pencil size={13} />
                              </button>
                            )}
                            <button 
                              onClick={(evt) => { evt.stopPropagation(); setUserFunctions(prev => prev.filter((_, idx) => idx !== e.userIdx)) }} 
                              className="p-1 rounded-lg hover:bg-danger/10 border border-transparent hover:border-danger/20 text-foreground-muted hover:text-danger transition-colors" 
                              title="Elimina"
                            >
                              <Trash2 size={13} />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Visibility Toggle Eye */}
                      <button 
                        onClick={() => toggleHidden(i)} 
                        className="p-1 rounded-lg hover:bg-surface-hover border border-transparent hover:border-surface-border text-foreground-muted hover:text-foreground transition-colors shrink-0" 
                        title={isHidden ? "Mostra" : "Nascondi"}
                      >
                        {isHidden ? <EyeOff size={14} className="text-foreground-subtle" /> : <Eye size={14} />}
                      </button>
                    </>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        <div className="h-px bg-surface-border/40 my-0.5 shrink-0" />

        {/* Action buttons */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <AnimatePresence mode="wait">
            {!isAddingMode ? (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddingMode(true)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-foreground-muted hover:text-foreground bg-surface/20 border border-transparent hover:border-surface-border/40 hover:bg-surface/35 transition-all w-full text-left"
              >
                <Plus size={14} className="opacity-60" />
                <span>Aggiungi funzione</span>
              </motion.button>
            ) : (
              <motion.form
                key="add-form"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!newFunctionInput.trim()) return
                  const sanitized = newFunctionInput.trim().toLowerCase().replace(/(sin|cos|tan|log|ln|exp|sqrt|abs)x/g, '$1(x)')
                  try { compile(sanitized); handleAddFunction(sanitized) } catch { setInputError(true) }
                }}
                className={`flex items-center gap-1.5 bg-background/60 border rounded-xl px-2.5 py-1.5 transition-all ${inputError ? 'border-danger/50 shadow-[0_0_8px_rgba(239,68,68,0.15)]' : 'border-surface-border focus-within:border-primary/50'}`}
              >
                <div className="w-2 h-2 rounded-full bg-success shrink-0" />
                <input 
                  autoFocus 
                  value={newFunctionInput} 
                  onChange={(e) => { setNewFunctionInput(e.target.value); setInputError(false) }} 
                  placeholder="es. sin(x) o x^2" 
                  className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder:text-foreground-subtle font-mono" 
                />
                <button type="submit" className="text-foreground-muted hover:text-success transition-colors"><Check size={14} /></button>
                <button type="button" onClick={() => { setIsAddingMode(false); setNewFunctionInput(''); setInputError(false) }} className="text-foreground-muted hover:text-danger transition-colors"><X size={14} /></button>
              </motion.form>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!isAIAssistMode ? (
              <motion.button
                key="ai-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAIAssistMode(true)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-primary bg-primary/5 border border-primary/10 hover:border-primary/20 hover:bg-primary/10 transition-all w-full text-left font-bold"
              >
                <Sparkles size={14} className="opacity-80" />
                <span>Chiedi all&apos;IA</span>
              </motion.button>
            ) : (
              <motion.form
                key="ai-form"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                onSubmit={(e) => { e.preventDefault(); handleAIAssist(aiPrompt) }}
                className={`flex items-center gap-1.5 bg-background/60 border rounded-xl px-2.5 py-1.5 transition-all ${aiError ? 'border-danger/50 shadow-[0_0_8px_rgba(239,68,68,0.15)]' : 'border-primary/30 focus-within:border-primary/60'}`}
              >
                {isAILoading ? (
                  <Loader2 size={14} className="text-primary animate-spin shrink-0" />
                ) : (
                  <Sparkles size={14} className="text-primary shrink-0 animate-pulse" />
                )}
                <input 
                  autoFocus 
                  value={aiPrompt} 
                  onChange={(e) => { setAiPrompt(e.target.value); setAiError(false) }} 
                  disabled={isAILoading} 
                  placeholder="es. Asse della parabola" 
                  className="bg-transparent border-none outline-none text-xs text-foreground w-full placeholder:text-foreground-subtle" 
                />
                {!isAILoading && (
                  <>
                    <button type="submit" className="text-foreground-muted hover:text-primary transition-colors"><Check size={14} /></button>
                    <button type="button" onClick={() => { setIsAIAssistMode(false); setAiPrompt(''); setAiError(false) }} className="text-foreground-muted hover:text-danger transition-colors"><X size={14} /></button>
                  </>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
