import { useState } from 'react'
import { Eye, EyeOff, TrendingUp, Plus, Check, X, Pencil, Trash2, Bot, Loader2, Minus, MoreHorizontal, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
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

  // Collapsed mode: thin glass bar
  if (collapsed) {
    return (
      <motion.div 
        layout
        className="flex flex-col items-center w-[42px] shrink-0 h-full relative bg-[#0F0F11]/95 backdrop-blur-md border-r border-[#2A2A2A] overflow-hidden"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {/* Expand button at top */}
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center py-3 text-[#666] hover:text-[#EAEAEA] transition-colors"
          title="Espandi sidebar"
        >
          <PanelLeftOpen size={15} />
        </button>
        <div className="w-8 h-px bg-[#2A2A2A]" />

        {/* Color dots */}
        <div className="flex-1 flex flex-col items-center gap-2.5 py-3">
          {allEspressioni.map((e, i) => {
            const isHidden = hiddenIndices.has(i)
            const displayColor = customColors[i] || e.color
            return (
              <div key={i} className="relative group/dot">
                <button
                  onClick={() => toggleHidden(i)}
                  className="w-[18px] h-[18px] rounded-full border-2 transition-transform hover:scale-110 shrink-0"
                  style={{
                    backgroundColor: isHidden ? 'transparent' : displayColor,
                    borderColor: displayColor,
                    opacity: isHidden ? 0.35 : 1
                  }}
                />
                <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-[#1A1A1A] border border-[#333] text-[#EAEAEA] text-[10px] font-medium px-2 py-1 rounded-md whitespace-nowrap opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none z-50">
                  {e.label}
                </div>
              </div>
            )
          })}
        </div>

        {allEspressioni.length > 0 && <div className="w-8 h-px bg-[#2A2A2A]" />}

        {/* Action icons */}
        <div className="flex flex-col items-center gap-2 py-2">
          <button
            onClick={() => setShowTangent(!showTangent)}
            className={`p-1.5 rounded-lg transition-colors ${showTangent ? 'text-[#EAB308]' : 'text-[#666] hover:text-[#EAEAEA]'}`}
            title={showTangent ? 'Nascondi tangente' : 'Mostra tangente'}
          >
            <TrendingUp size={15} />
          </button>

          <div className="relative">
            <button
              onClick={() => setIsAddingMode(!isAddingMode)}
              className={`p-1.5 rounded-lg transition-colors ${isAddingMode ? 'text-[#10B981]' : 'text-[#666] hover:text-[#EAEAEA]'}`}
              title="Aggiungi funzione"
            >
              <Plus size={15} />
            </button>
            <AnimatePresence>
              {isAddingMode && (
                <motion.form
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!newFunctionInput.trim()) return
                    const sanitized = newFunctionInput.trim().toLowerCase().replace(/(sin|cos|tan|log|ln|exp|sqrt|abs)x/g, '$1(x)')
                    try { compile(sanitized); handleAddFunction(sanitized) } catch { setInputError(true) }
                  }}
                  className="absolute left-9 bottom-0 bg-[#141414] border border-[#333] rounded-xl p-2 flex items-center gap-1.5 z-50 shadow-xl"
                >
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} className="shrink-0" />
                  <input autoFocus value={newFunctionInput} onChange={(e) => { setNewFunctionInput(e.target.value); setInputError(false) }} placeholder="es. sin(x)" className="bg-transparent border-none outline-none text-xs text-[#EAEAEA] w-28" />
                  <button type="submit" className="text-[#888] hover:text-[#10B981]"><Check size={13} /></button>
                  <button type="button" onClick={() => { setIsAddingMode(false); setNewFunctionInput(''); setInputError(false) }} className="text-[#888] hover:text-[#F43F5E]"><X size={13} /></button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsAIAssistMode(!isAIAssistMode)}
              className={`p-1.5 rounded-lg transition-colors ${isAIAssistMode ? 'text-[#EAB308]' : 'text-[#666] hover:text-[#EAEAEA]'}`}
              title="Chiedi all'IA"
            >
              <Bot size={15} />
            </button>
            <AnimatePresence>
              {isAIAssistMode && (
                <motion.form
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  onSubmit={(e) => { e.preventDefault(); if (isAILoading) return; handleAIAssist(aiPrompt) }}
                  className="absolute left-9 bottom-0 bg-[#141414] border border-[#EAB308]/30 rounded-xl p-2 flex items-center gap-1.5 z-50 shadow-xl"
                >
                  {isAILoading ? <Loader2 size={14} className="text-[#EAB308] animate-spin shrink-0" /> : <Bot size={14} className="text-[#EAB308] shrink-0" />}
                  <input autoFocus value={aiPrompt} onChange={(e) => { setAiPrompt(e.target.value); setAiError(false) }} disabled={isAILoading} placeholder="es. Asse parabola" className="bg-transparent border-none outline-none text-xs text-[#EAEAEA] w-32" />
                  {!isAILoading && (<><button type="submit" className="text-[#888] hover:text-[#EAB308]"><Check size={13} /></button><button type="button" onClick={() => { setIsAIAssistMode(false); setAiPrompt(''); setAiError(false) }} className="text-[#888] hover:text-[#F43F5E]"><X size={13} /></button></>)}
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    )
  }

  // Expanded mode
  return (
    <motion.div 
      layout
      className="flex flex-col w-full md:w-64 shrink-0 h-full bg-[#0F0F11]/95 backdrop-blur-md border-r border-[#2A2A2A] overflow-hidden"
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header with title + collapse button */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#2A2A2A]/50 shrink-0">
        <span className="text-[11px] font-semibold text-[#777] uppercase tracking-wider">Elementi</span>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded-md text-[#666] hover:text-[#EAEAEA] hover:bg-[#1A1A1A] transition-colors"
          title="Collassa sidebar"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 px-3 py-3">
        {/* Tangent toggle */}
        <button
          onClick={() => setShowTangent(!showTangent)}
          className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all w-full text-left
            ${showTangent 
              ? 'text-[#EAB308]' 
              : 'text-[#888] hover:text-[#CCC]'
            }`}
        >
          <TrendingUp size={14} className={showTangent ? 'opacity-100' : 'opacity-50'} />
          <span>{showTangent ? 'Tangente attiva' : 'Mostra tangente'}</span>
          <div className={`ml-auto w-2 h-2 rounded-full transition-colors ${showTangent ? 'bg-[#EAB308]' : 'bg-[#444]'}`} />
        </button>

        {allEspressioni.length > 0 && (
          <div className="h-px bg-[#2A2A2A]/50 mx-1 my-1" />
        )}

        {/* Element list */}
        <div className="flex flex-col gap-0.5">
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
                  className="group/item flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#1A1A1A]/60 transition-colors"
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
                      <input autoFocus value={editInput} onChange={ev => setEditInput(ev.target.value)} className="bg-[#0A0A0A] border border-[#EAB308]/50 outline-none text-xs text-[#EAEAEA] w-full px-2 py-1 rounded" />
                      <button type="submit" className="text-[#10B981] hover:text-[#059669]"><Check size={14} /></button>
                      <button type="button" onClick={() => setEditingUserIdx(null)} className="text-[#F43F5E] hover:text-[#E11D48]"><X size={14} /></button>
                    </form>
                  ) : (
                    <>
                      <div className="relative shrink-0">
                        <div 
                          className={`w-2.5 h-2.5 rounded-full transition-transform ${isHidden ? 'scale-75 opacity-40' : ''}`}
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
                      <span className={`text-[12px] flex-1 truncate transition-colors ${isHidden ? 'text-[#555] line-through' : 'text-[#CCC]'}`}>
                        {e.label}
                      </span>

                      {/* Hover controls */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        {(e.type === 'function' || e.type === 'derivative') && (
                          <button 
                            onClick={(evt) => { evt.stopPropagation(); setCustomStyles(prev => ({ ...prev, [i]: displayStyle === 'solid' ? 'dashed' : 'solid' })) }}
                            className="p-1 rounded hover:bg-[#2A2A2A] text-[#666] hover:text-[#CCC]"
                            title={displayStyle === 'solid' ? 'Tratteggiata' : 'Continua'}
                          >
                            {displayStyle === 'solid' ? <Minus size={12} /> : <MoreHorizontal size={12} />}
                          </button>
                        )}
                        {e.isUser && (
                          <>
                            {e.type === 'function' && (
                              <button onClick={(evt) => { evt.stopPropagation(); setEditingUserIdx(e.userIdx ?? null); setEditInput(e.fn || '') }} className="p-1 rounded hover:bg-[#2A2A2A] text-[#666] hover:text-[#CCC]" title="Modifica">
                                <Pencil size={12} />
                              </button>
                            )}
                            <button onClick={(evt) => { evt.stopPropagation(); setUserFunctions(prev => prev.filter((_, idx) => idx !== e.userIdx)) }} className="p-1 rounded hover:bg-[#2A2A2A] text-[#666] hover:text-[#F43F5E]" title="Elimina">
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>

                      <button onClick={() => toggleHidden(i)} className="p-1 rounded hover:bg-[#2A2A2A] transition-colors shrink-0" title={isHidden ? "Mostra" : "Nascondi"}>
                        {isHidden ? <EyeOff size={14} color="#444" /> : <Eye size={14} color="#666" />}
                      </button>
                    </>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        <div className="h-px bg-[#2A2A2A]/50 mx-1 my-1" />

        {/* Action buttons */}
        <div className="flex flex-col gap-1">
          <AnimatePresence mode="wait">
            {!isAddingMode ? (
              <motion.button
                key="add-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsAddingMode(true)}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-[#888] hover:text-[#CCC] hover:bg-[#1A1A1A]/60 transition-colors w-full text-left"
              >
                <Plus size={14} className="opacity-50" />
                Aggiungi funzione
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
                className={`flex items-center gap-1.5 bg-[#141414] border rounded-lg px-2 py-1.5 transition-colors ${inputError ? 'border-red-500/50' : 'border-[#333] focus-within:border-[#555]'}`}
              >
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} className="shrink-0" />
                <input autoFocus value={newFunctionInput} onChange={(e) => { setNewFunctionInput(e.target.value); setInputError(false) }} placeholder="es. sin(x) o x^2" className="bg-transparent border-none outline-none text-xs text-[#EAEAEA] w-full placeholder:text-[#555]" />
                <button type="submit" className="text-[#888] hover:text-[#10B981]"><Check size={13} /></button>
                <button type="button" onClick={() => { setIsAddingMode(false); setNewFunctionInput(''); setInputError(false) }} className="text-[#888] hover:text-[#F43F5E]"><X size={13} /></button>
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
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-[#EAB308]/70 hover:text-[#EAB308] hover:bg-[#EAB308]/5 transition-colors w-full text-left"
              >
                <Bot size={14} />
                Chiedi all&apos;IA
              </motion.button>
            ) : (
              <motion.form
                key="ai-form"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                onSubmit={(e) => { e.preventDefault(); handleAIAssist(aiPrompt) }}
                className={`flex items-center gap-1.5 bg-[#141414] border rounded-lg px-2 py-1.5 transition-colors ${aiError ? 'border-red-500/50' : 'border-[#EAB308]/30 focus-within:border-[#EAB308]/60'}`}
              >
                {isAILoading ? <Loader2 size={14} className="text-[#EAB308] animate-spin shrink-0" /> : <Bot size={14} className="text-[#EAB308] shrink-0" />}
                <input autoFocus value={aiPrompt} onChange={(e) => { setAiPrompt(e.target.value); setAiError(false) }} disabled={isAILoading} placeholder="es. Asse della parabola" className="bg-transparent border-none outline-none text-xs text-[#EAEAEA] w-full placeholder:text-[#555]" />
                {!isAILoading && (<><button type="submit" className="text-[#888] hover:text-[#EAB308]"><Check size={13} /></button><button type="button" onClick={() => { setIsAIAssistMode(false); setAiPrompt(''); setAiError(false) }} className="text-[#888] hover:text-[#F43F5E]"><X size={13} /></button></>)}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
