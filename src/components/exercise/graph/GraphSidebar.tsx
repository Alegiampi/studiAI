import { useState } from 'react'
import { Eye, EyeOff, TrendingUp, Plus, Check, X, Pencil, Trash2, Bot, Loader2, Minus, MoreHorizontal } from 'lucide-react'
import { compile } from 'mathjs'
import { motion, AnimatePresence } from 'framer-motion'

interface GraphSidebarProps {
  allEspressioni: any[];
  userFunctions: any[];
  setUserFunctions: React.Dispatch<React.SetStateAction<any[]>>;
  hiddenIndices: Set<number>;
  setHiddenIndices: React.Dispatch<React.SetStateAction<Set<number>>>;
  showTangent: boolean;
  setShowTangent: (val: boolean) => void;
  customColors: Record<number, string>;
  setCustomColors: React.Dispatch<React.SetStateAction<Record<number, string>>>;
  customStyles: Record<number, 'solid' | 'dashed'>;
  setCustomStyles: React.Dispatch<React.SetStateAction<Record<number, 'solid' | 'dashed'>>>;
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
  setCustomStyles
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

  return (
    <div className="flex flex-col gap-4 w-full md:w-64 shrink-0">
      <div className="text-[11px] font-semibold text-[#888] uppercase tracking-wider">
        Grafico Interattivo
      </div>

      <div className="flex flex-col gap-2">
        {/* Toggle Tangente Globale */}
        <button
          onClick={() => setShowTangent(!showTangent)}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-300 text-xs font-medium w-full
            ${showTangent 
              ? 'bg-[#EAB308]/10 border-[#EAB308]/30 text-[#EAB308] hover:bg-[#EAB308]/20' 
              : 'bg-[#1A1A1A] border-[#333] text-[#888] hover:border-[#555] hover:text-[#EAEAEA]'
            }
          `}
        >
          <TrendingUp size={14} />
          {showTangent ? 'Nascondi tangente' : 'Mostra tangente'}
        </button>

        {allEspressioni.length > 0 && (
          <div className="h-px w-full bg-[#333] my-2" />
        )}

        <div className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {allEspressioni.map((e, i) => {
              const isHidden = hiddenIndices.has(i)
              const displayColor = customColors[i] || e.color
              
              const defaultStyle = e.label?.toLowerCase().includes('asintoto') ? 'dashed' : 'solid'
              const displayStyle = customStyles[i] || defaultStyle

              return (
                <motion.div 
                  key={i} 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ 
                    opacity: isHidden ? 0.6 : 1, 
                    scale: 1,
                    backgroundColor: isHidden ? 'rgba(17, 17, 17, 0.8)' : 'rgba(26, 26, 26, 1)',
                    borderColor: isHidden ? 'rgba(34, 34, 34, 0.5)' : 'rgba(51, 51, 51, 1)'
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="flex items-center justify-between p-2 rounded-xl border group backdrop-blur-sm"
                >
                  {editingUserIdx === e.userIdx && e.isUser && e.type === 'function' ? (
                    <form 
                      onSubmit={(evt) => {
                        evt.preventDefault()
                        if (!editInput.trim()) return
                        let sanitized = editInput.trim().toLowerCase()
                        sanitized = sanitized.replace(/(sin|cos|tan|log|ln|exp|sqrt|abs)x/g, '$1(x)')
                        try {
                          compile(sanitized)
                          setUserFunctions(prev => prev.map((f, idx) => 
                            idx === e.userIdx ? { ...f, fn: sanitized } : f
                          ))
                          setEditingUserIdx(null)
                        } catch {
                          // ignore error or show UI
                        }
                      }}
                      className="flex-1 flex items-center gap-2"
                    >
                      <input 
                        autoFocus
                        value={editInput}
                        onChange={ev => setEditInput(ev.target.value)}
                        className="bg-[#0A0A0A] border border-[#EAB308]/50 outline-none text-xs text-[#EAEAEA] w-full px-2 py-1 rounded"
                      />
                      <button type="submit" className="text-[#10B981] hover:text-[#059669]"><Check size={14} /></button>
                      <button type="button" onClick={() => setEditingUserIdx(null)} className="text-[#F43F5E] hover:text-[#E11D48]"><X size={14} /></button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative">
                          <div 
                            className={`w-3 h-3 rounded-full shrink-0 transition-transform ${isHidden ? 'scale-75' : 'scale-100'}`}
                            style={{ backgroundColor: displayColor }}
                          />
                          <input
                            type="color"
                            value={displayColor}
                            onChange={(evt) => {
                              setCustomColors(prev => ({
                                ...prev,
                                [i]: evt.target.value
                              }))
                            }}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            title="Cambia colore"
                          />
                        </div>
                        <span className={`text-xs font-medium flex-1 truncate transition-colors duration-300 ${isHidden ? 'text-[#555]' : 'text-[#EAEAEA]'}`}>
                          {(e as any).label}
                        </span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {e.type === 'function' && (
                            <button 
                              onClick={(evt) => {
                                evt.stopPropagation()
                                setCustomStyles(prev => ({
                                  ...prev,
                                  [i]: displayStyle === 'solid' ? 'dashed' : 'solid'
                                }))
                              }}
                              className="p-1 hover:bg-[#333] rounded text-[#888] hover:text-[#EAEAEA]"
                              title={displayStyle === 'solid' ? 'Rendi tratteggiata' : 'Rendi continua'}
                            >
                              {displayStyle === 'solid' ? <Minus size={12} /> : <MoreHorizontal size={12} />}
                            </button>
                          )}
                          {e.isUser && (
                            <>
                              {e.type === 'function' && (
                                <button 
                                  onClick={(evt) => {
                                    evt.stopPropagation()
                                    setEditingUserIdx((e as any).userIdx)
                                    setEditInput((e as any).fn)
                                  }}
                                  className="p-1 hover:bg-[#333] rounded text-[#888] hover:text-[#EAEAEA]"
                                  title="Modifica"
                                >
                                  <Pencil size={12} />
                                </button>
                              )}
                              <button 
                                onClick={(evt) => {
                                  evt.stopPropagation()
                                  setUserFunctions(prev => prev.filter((_, idx) => idx !== (e as any).userIdx))
                                }}
                                className="p-1 hover:bg-[#333] rounded text-[#888] hover:text-[#F43F5E]"
                                title="Elimina"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setHiddenIndices(prev => {
                            const next = new Set(prev)
                            if (next.has(i)) next.delete(i)
                            else next.add(i)
                            return next
                          })
                        }}
                        className="p-1.5 hover:bg-[#333] rounded-lg transition-colors ml-1"
                        title={isHidden ? "Mostra" : "Nascondi"}
                      >
                        {isHidden ? (
                          <EyeOff size={14} color="#444" />
                        ) : (
                          <Eye size={14} color="#888" />
                        )}
                      </button>
                    </>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!isAddingMode && !isAIAssistMode ? (
              <motion.div 
                key="buttons"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex gap-2 mt-1"
              >
                <button 
                  onClick={() => setIsAddingMode(true)}
                  className="flex-1 flex items-center justify-center gap-2 text-[#888] hover:text-[#EAEAEA] text-xs font-medium px-3 py-2 transition-colors border border-dashed border-[#333] hover:border-[#666] rounded-xl"
                >
                  <Plus size={14} /> Aggiungi
                </button>
                <button 
                  onClick={() => setIsAIAssistMode(true)}
                  className="flex-1 flex items-center justify-center gap-2 text-[#EAB308] hover:text-[#FDE047] text-xs font-medium px-3 py-2 transition-colors border border-dashed border-[#EAB308]/30 hover:border-[#EAB308]/60 rounded-xl bg-[#EAB308]/10"
                >
                  <Bot size={14} /> Chiedi all'IA
                </button>
              </motion.div>
            ) : isAddingMode ? (
              <motion.form 
                key="add-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!newFunctionInput.trim()) return
                  
                  let sanitized = newFunctionInput.trim().toLowerCase()
                  sanitized = sanitized.replace(/(sin|cos|tan|log|ln|exp|sqrt|abs)x/g, '$1(x)')
                  
                  try {
                    compile(sanitized)
                    const randomColors = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899']
                    const color = randomColors[userFunctions.length % randomColors.length]
                    setUserFunctions(prev => [...prev, { type: 'function', fn: sanitized, color }])
                    setNewFunctionInput('')
                    setIsAddingMode(false)
                    setInputError(false)
                  } catch {
                    setInputError(true)
                  }
                }}
                className={`flex items-center gap-2 mt-1 bg-[#1A1A1A] border rounded-xl px-3 py-1.5 transition-colors ${inputError ? 'border-red-500/50' : 'border-[#444] focus-within:border-[#666]'}`}
              >
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#10B981' }} className="shrink-0" />
                <input
                  autoFocus
                  value={newFunctionInput}
                  onChange={(e) => {
                    setNewFunctionInput(e.target.value)
                    setInputError(false)
                  }}
                  placeholder="es. sin(x) o x^2"
                  className="bg-transparent border-none outline-none text-xs text-[#EAEAEA] w-full"
                />
                <button type="submit" className="text-[#888] hover:text-[#10B981]" title="Conferma">
                  <Check size={14} />
                </button>
                <button type="button" onClick={() => {
                  setIsAddingMode(false)
                  setNewFunctionInput('')
                  setInputError(false)
                }} className="text-[#888] hover:text-[#F43F5E]" title="Annulla">
                  <X size={14} />
                </button>
              </motion.form>
            ) : (
              <motion.form 
                key="ai-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (!aiPrompt.trim() || isAILoading) return
                  
                  setIsAILoading(true)
                  setAiError(false)
                  
                  try {
                    const res = await fetch('/api/graph/assist', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        prompt: aiPrompt,
                        context: allEspressioni
                      })
                    })
                    
                    if (!res.ok) throw new Error('Errore API')
                    const newElements = await res.json()
                    
                    setUserFunctions(prev => [
                      ...prev,
                      ...newElements.map((el: any) => ({
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
                }}
                className={`flex items-center gap-2 mt-1 bg-[#1A1A1A] border rounded-xl px-3 py-1.5 transition-colors ${aiError ? 'border-red-500/50' : 'border-[#EAB308]/50 focus-within:border-[#EAB308]'}`}
              >
                {isAILoading ? (
                  <Loader2 size={14} className="text-[#EAB308] animate-spin shrink-0" />
                ) : (
                  <Bot size={14} className="text-[#EAB308] shrink-0" />
                )}
                <input
                  autoFocus
                  value={aiPrompt}
                  onChange={(e) => {
                    setAiPrompt(e.target.value)
                    setAiError(false)
                  }}
                  disabled={isAILoading}
                  placeholder="es. Asse della parabola"
                  className="bg-transparent border-none outline-none text-xs text-[#EAEAEA] w-full"
                />
                {!isAILoading && (
                  <>
                    <button type="submit" className="text-[#888] hover:text-[#EAB308]" title="Chiedi">
                      <Check size={14} />
                    </button>
                    <button type="button" onClick={() => {
                      setIsAIAssistMode(false)
                      setAiPrompt('')
                      setAiError(false)
                    }} className="text-[#888] hover:text-[#F43F5E]" title="Annulla">
                      <X size={14} />
                    </button>
                  </>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
