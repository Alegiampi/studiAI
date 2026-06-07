import { Passo } from '@/types'

/**
 * Formato JSON strutturato prodotto dalla nuova API (nuovo formato).
 * Compatibile direttamente con il tipo { titolo, passi[], finale }.
 */
interface ExplanationJSON {
  titolo?: string
  passi: Array<{ titolo: string; corpo: string }>
  finale?: string
}

/**
 * Parser legacy per il vecchio formato testo con marker PASSO N:/TITOLO:/RISPOSTA FINALE:.
 * Mantenuto per retrocompatibilità con le spiegazioni già salvate nel DB.
 */
function parseExplanationLegacy(text: string): { titolo: string; passi: Passo[]; finale: string } {
  const lines = text.split('\n')
  let titolo = ''
  const passi: Passo[] = []
  let finale = ''
  let currentPasso: Passo | null = null
  let inFinale = false

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('TITOLO:')) {
      titolo = trimmed.replace('TITOLO:', '').trim()
    } else if (trimmed.match(/^PASSO \d+:/)) {
      if (currentPasso) passi.push(currentPasso)
      inFinale = false
      currentPasso = { titolo: trimmed.replace(/^PASSO \d+:/, '').trim(), corpo: '' }
    } else if (trimmed.startsWith('RISPOSTA FINALE:')) {
      if (currentPasso) { passi.push(currentPasso); currentPasso = null }
      inFinale = true
      // Prende il testo sulla stessa riga del marker (se presente)
      const sameLine = trimmed.replace('RISPOSTA FINALE:', '').trim()
      if (sameLine) finale = sameLine
    } else if (inFinale) {
      // Accumula righe successive della risposta finale (supporto multi-riga)
      finale += (finale ? '\n' : '') + trimmed
    } else if (currentPasso) {
      currentPasso.corpo += (currentPasso.corpo ? '\n' : '') + trimmed
    }
  }

  if (currentPasso) passi.push(currentPasso)

  return { titolo, passi, finale }
}

/**
 * Trova ed estrae la stringa JSON corretta dal testo bilanciando le parentesi graffe.
 * Ritorna la stringa JSON se valida e contenente "passi", altrimenti null.
 */
function findJSON(text: string): string | null {
  let startIdx = 0
  while (true) {
    const braceIdx = text.indexOf('{', startIdx)
    if (braceIdx === -1) break

    // Cerca la parentesi graffa di chiusura corrispondente bilanciando le parentesi
    let depth = 0
    let inString = false
    let escaped = false
    let found = false
    let endIdx = -1

    for (let i = braceIdx; i < text.length; i++) {
      const char = text[i]
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === '"') {
        inString = !inString
        continue
      }
      if (!inString) {
        if (char === '{') {
          depth++
        } else if (char === '}') {
          depth--
          if (depth === 0) {
            endIdx = i
            found = true
            break
          }
        }
      }
    }

    if (found && endIdx !== -1) {
      const candidate = text.slice(braceIdx, endIdx + 1)
      try {
        const parsed = JSON.parse(candidate)
        if (parsed && typeof parsed === 'object' && 'passi' in parsed) {
          return candidate
        }
      } catch {
        // Ignora gli errori di parse e cerca la prossima '{'
      }
    }
    startIdx = braceIdx + 1
  }
  return null
}

/**
 * Funzione principale di parsing.
 *
 * 1. Se `text` è JSON valido con la struttura { passi: [...] } → usa direttamente (nuovo formato)
 * 2. Altrimenti → delega al parser legacy (retrocompatibilità DB)
 */
function parseExplanationRaw(text: string, isStreaming = false): { titolo: string; passi: Passo[]; finale: string } {
  // Tenta prima il parsing JSON completo
  const jsonStr = findJSON(text)
  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr) as ExplanationJSON
      if (parsed.passi && Array.isArray(parsed.passi) && parsed.passi.length > 0) {
        return {
          titolo: parsed.titolo ?? '',
          passi: parsed.passi.map(p => ({
            titolo: p.titolo ?? '',
            corpo: p.corpo ?? ''
          })),
          finale: parsed.finale ?? ''
        }
      }
    } catch {
      // JSON malformato: fallthrough al parser parziale/legacy
    }
  }

  // Se non siamo in modalità streaming, costringiamo il fallback immediato al parser legacy (comportamento originario)
  if (!isStreaming) {
    return parseExplanationLegacy(text)
  }

  // Se non è un JSON valido completo ed è attiva la modalità streaming, proviamo con il parsing parziale del flusso
  let titolo = ''
  const passi: Passo[] = []
  let finale = ''

  // Funzione di utilità per pulire i caratteri di escape del JSON (regex a singolo passaggio)
  const cleanEscapes = (str: string) => {
    return str.replace(/\\([\\nt"\/])/g, (match, p1) => {
      if (p1 === 'n') return '\n'
      if (p1 === 't') return '\t'
      if (p1 === '"') return '"'
      if (p1 === '\\') return '\\'
      if (p1 === '/') return '/'
      return match
    })
  }

  // Tenta di estrarre il "titolo"
  // Match per: "titolo": "..."
  const titoloMatch = text.match(/"titolo"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
  if (titoloMatch) {
    titolo = cleanEscapes(titoloMatch[1])
  } else {
    // Se la stringa del titolo non è ancora chiusa, proviamo a catturare quello che c'è
    const partialTitoloMatch = text.match(/"titolo"\s*:\s*"([^"]*)$/)
    if (partialTitoloMatch) {
      titolo = cleanEscapes(partialTitoloMatch[1])
    }
  }

  // Tenta di estrarre il "finale"
  const finaleMatch = text.match(/"finale"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
  if (finaleMatch) {
    finale = cleanEscapes(finaleMatch[1])
  } else {
    const partialFinaleMatch = text.match(/"finale"\s*:\s*"([^"]*)$/)
    if (partialFinaleMatch) {
      finale = cleanEscapes(partialFinaleMatch[1])
    }
  }

  // Estrazione parziale dell'array "passi"
  const passiIndex = text.indexOf('"passi"')
  if (passiIndex !== -1) {
    const arrayStartIndex = text.indexOf('[', passiIndex)
    if (arrayStartIndex !== -1) {
      // Troviamo i blocchi tra parentesi graffe {} all'interno delle quadre del campo "passi"
      let depth = 0
      let stepStart = -1
      
      for (let i = arrayStartIndex + 1; i < text.length; i++) {
        const char = text[i]
        if (char === '{') {
          if (depth === 0) {
            stepStart = i
          }
          depth++
        } else if (char === '}') {
          depth--
          if (depth === 0 && stepStart !== -1) {
            const stepJson = text.slice(stepStart, i + 1)
            try {
              const stepObj = JSON.parse(stepJson)
              passi.push({
                titolo: cleanEscapes(stepObj.titolo || ''),
                corpo: cleanEscapes(stepObj.corpo || '')
              })
            } catch {
              // Esecuzione euristica se fallisce il parse dell'oggetto singolo ma è comunque chiuso
              const tMatch = stepJson.match(/"titolo"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
              const cMatch = stepJson.match(/"corpo"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
              passi.push({
                titolo: cleanEscapes(tMatch ? tMatch[1] : ''),
                corpo: cleanEscapes(cMatch ? cMatch[1] : '')
              })
            }
            stepStart = -1
          }
        }
      }

      // Se abbiamo un passo iniziato ma non ancora chiuso con '}' (è quello attualmente in streaming)
      if (depth > 0 && stepStart !== -1) {
        const stepJson = text.slice(stepStart)
        const tMatch = stepJson.match(/"titolo"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
        
        let corpo = ''
        // Troviamo l'inizio del campo "corpo"
        const corpoIndex = stepJson.indexOf('"corpo"')
        if (corpoIndex !== -1) {
          const colonIndex = stepJson.indexOf(':', corpoIndex)
          if (colonIndex !== -1) {
            const quoteStart = stepJson.indexOf('"', colonIndex)
            if (quoteStart !== -1) {
              // Leggiamo fino alla fine della stringa gestendo i caratteri di escape
              let inEscape = false
              let foundEnd = false
              let j = quoteStart + 1
              for (; j < stepJson.length; j++) {
                const c = stepJson[j]
                if (inEscape) {
                  inEscape = false
                } else if (c === '\\') {
                  inEscape = true
                } else if (c === '"') {
                  corpo = stepJson.slice(quoteStart + 1, j)
                  foundEnd = true
                  break
                }
              }
              if (!foundEnd) {
                corpo = stepJson.slice(quoteStart + 1)
              }
            }
          }
        }

        passi.push({
          titolo: cleanEscapes(tMatch ? tMatch[1] : ''),
          corpo: cleanEscapes(corpo)
        })
      }
    }
  }

  // Se abbiamo trovato dei passi tramite parsing parziale strutturato, li restituiamo
  if (passi.length > 0 || titolo !== '') {
    return { titolo, passi, finale }
  }

  // Fallback finale: vecchio parser legacy per retrocompatibilità
  return parseExplanationLegacy(text)
}

export function parseExplanation(text: string, isStreaming = false): { titolo: string; passi: Passo[]; finale: string } {
  const raw = parseExplanationRaw(text, isStreaming)
  return {
    titolo: healLaTeX(raw.titolo),
    passi: raw.passi.map(p => ({
      titolo: healLaTeX(p.titolo),
      corpo: healLaTeX(p.corpo)
    })),
    finale: healLaTeX(raw.finale)
  }
}

/**
 * Riconosce la fine reale di un'espressione LaTeX complessa includendo argomenti
 * tra parentesi graffe `{...}`, quadre `[...]` e pedici/apici (`_`, `^`).
 */
function consumeLatexExpression(text: string, startIndex: number, cmdLength: number): number {
  let i = startIndex + 1 + cmdLength // salta '\\' e il nome del comando
  
  const findBalancedMarker = (openChar: string, closeChar: string): number => {
    let depth = 0
    let inString = false
    let escaped = false
    for (let j = i; j < text.length; j++) {
      const char = text[j]
      if (escaped) {
        escaped = false
        continue
      }
      if (char === '\\') {
        escaped = true
        continue
      }
      if (char === '"') {
        inString = !inString
        continue
      }
      if (!inString) {
        if (char === openChar) {
          depth++
        } else if (char === closeChar) {
          depth--
          if (depth === 0) {
            return j
          }
        }
      }
    }
    return -1
  }

  // Consuma ricorsivamente argomenti o pedici/apici
  while (i < text.length) {
    const beforeWhitespace = i
    while (i < text.length && /\s/.test(text[i])) {
      i++
    }

    const char = text[i]
    if (char === '{') {
      const endBrace = findBalancedMarker('{', '}')
      if (endBrace !== -1) {
        i = endBrace + 1
        continue
      }
    } else if (char === '[') {
      const endBracket = findBalancedMarker('[', ']')
      if (endBracket !== -1) {
        i = endBracket + 1
        continue
      }
    } else if (char === '_' || char === '^') {
      i++ // consuma '_' o '^'
      while (i < text.length && /\s/.test(text[i])) {
        i++
      }
      if (text[i] === '{') {
        const endBrace = findBalancedMarker('{', '}')
        if (endBrace !== -1) {
          i = endBrace + 1
          continue
        }
      } else if (text[i] === '\\') {
        i++ // salta '\\'
        while (i < text.length && /[a-zA-Z]/.test(text[i])) {
          i++
        }
        continue
      } else if (i < text.length) {
        i++ // consuma singolo carattere (es. _0 o ^2)
        continue
      }
    }

    i = beforeWhitespace
    break
  }

  return i
}

function getMathRanges(text: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  let inBlock = false
  let inInline = false
  let blockStart = -1
  let inlineStart = -1
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\' && text[i + 1] === '$') {
      i++ // salta il dollaro con escape
      continue
    }
    
    if (text[i] === '$' && text[i + 1] === '$') {
      if (inInline) {
        inInline = false
        ranges.push([inlineStart, i - 1])
      }
      if (inBlock) {
        inBlock = false
        ranges.push([blockStart, i + 1])
      } else {
        inBlock = true
        blockStart = i
      }
      i++ // salta il secondo dollaro
    } else if (text[i] === '$') {
      if (inBlock) {
        continue
      }
      if (inInline) {
        inInline = false
        ranges.push([inlineStart, i])
      } else {
        inInline = true
        inlineStart = i
      }
    }
  }
  if (inBlock && blockStart !== -1) {
    ranges.push([blockStart, text.length - 1])
  } else if (inInline && inlineStart !== -1) {
    ranges.push([inlineStart, text.length - 1])
  }
  return ranges
}

function isIndexInRanges(idx: number, ranges: Array<[number, number]>): boolean {
  for (const [start, end] of ranges) {
    if (idx >= start && idx <= end) {
      return true
    }
  }
  return false
}

export function healLaTeX(text: string): string {
  if (!text) return text

  let fixed = text

  // 0. Convert corrupted control characters from unescaped JSON backslashes back to LaTeX backslashes
  fixed = fixed.replace(/\x0c/g, '\\f') // Form Feed -> \f (e.g. \frac)
  fixed = fixed.replace(/\x08/g, '\\b') // Backspace -> \b (e.g. \beta, \boxed, \begin)
  fixed = fixed.replace(/\x09/g, '\\t') // Tab -> \t (e.g. \times, \theta, \to, \tan, \text)
  fixed = fixed.replace(/\x0d/g, '\\r') // Carriage Return -> \r (e.g. \rightarrow, \rho)
  fixed = fixed.replace(/\x0a(?=eq\b|ewline\b|abla\b|ot\b|u\b|um\b)/gi, '\\n') // Newline -> \n (e.g. \neq)

  // 0.1 Convert alternative LaTeX delimiters to standard ones (\[ \] -> $$, \( \) -> $)
  fixed = fixed.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
  fixed = fixed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')

  // 0.1 Normalize missing backslashes on begin/end environments (e.g. begin{aligned}, end{cases})
  fixed = fixed.replace(/(?<!\\)\b(begin|end)\{(aligned|cases|matrix|pmatrix|vmatrix|bmatrix|Bmatrix|Vmatrix|gather|split|array|equation)\}/gi, '\\$1{$2}')

  // 0.2 Decode HTML entities that may appear in AI responses (e.g. &amp; → &, &lt; → <, &gt; → >)
  fixed = fixed.replace(/&amp;/g, '&')
  fixed = fixed.replace(/&lt;/g, '<')
  fixed = fixed.replace(/&gt;/g, '>')

  // 1. Normalize text-based and unescaped infinity symbols (e.g. +infinito, -infty, piu infinito)
  // to standard LaTeX equivalents globally first.
  fixed = fixed.replace(/(?<!\\)(?:più|\+)\s*(?:infinito|infty)\b/gi, '+\\infty')
  fixed = fixed.replace(/(?<!\\)(?:meno|-)\s*(?:infinito|infty)\b/gi, '-\\infty')
  fixed = fixed.replace(/(?<!\\)\b(?:infinito|infty)\b/gi, '\\infty')

  // 2. Normalize common LaTeX implication/arrow and other symbols that are missing their backslash
  // Prevent matching substrings of longer words by ensuring it's not preceded by a letter or backslash
  const symbolRegex = /(?<![a-zA-Z\\])(Leftrightarrow|leftrightarrow|Rightarrow|rightarrow|Leftarrow|leftarrow|partial|mathbb|mathrm|mathbf|mathcal|mathsf|mathit|quad|qquad|forall|exists|infty|nabla|approx|simeq|equiv|propto|emptyset|otimes|oplus|subseteq|supseteq|notin)/g
  fixed = fixed.replace(symbolRegex, '\\$1')

  // Include greek letters and standard math functions, but strictly omit collisions with Italian words (like "le" and "in").
  const wordSymbolRegex = /(?<![a-zA-Z\\])(pm|neq|ge|cdot|sin|cos|tan|cot|sec|csc|log|ln|lim|frac|sqrt|int|sum|prod|oint|iint|iiint|alpha|beta|gamma|delta|epsilon|theta|lambda|sigma|omega|Gamma|Delta|Theta|Lambda|Pi|Sigma|Omega|max|min|sup|inf|det|dim|ker|arg|left|right)(?![a-zA-Z\u00C0-\u024F])/g
  fixed = fixed.replace(wordSymbolRegex, '\\$1')

  // 3. Wrap standalone math commands (and their preceding sign if unary) in inline math delimiters $...$ if they are outside math blocks.
  const ranges = getMathRanges(fixed)
  const knownCmds = [
    'Leftrightarrow', 'leftrightarrow', 'Rightarrow', 'rightarrow',
    'Leftarrow', 'leftarrow',
    'subseteq', 'supseteq', 'underset', 'overset', 'varnothing',
    'mathrm', 'mathbf', 'mathcal', 'mathbb', 'mathit', 'mathsf',
    'partial', 'infty', 'nabla', 'approx', 'simeq', 'equiv',
    'propto', 'forall', 'exists', 'emptyset', 'otimes', 'oplus',
    'subset', 'supset', 'notin', 'wedge', 'iint', 'iiint',
    'alpha', 'beta', 'gamma', 'delta', 'theta', 'lambda',
    'sigma', 'omega', 'cdot', 'quad', 'frac', 'sqrt', 'boxed', 'binom',
    'choose', 'wedge', 'vee', 'times', 'div',
    'sin', 'cos', 'tan', 'log', 'ln', 'lim', 'sum', 'prod', 'int',
    'oint', 'text', 'cong', 'odot', 'neq', 'pm', 'ge', 'le',
    'ni', 'mu', 'pi', 'in', 'div', 'sim', 'cup', 'cap', 'ln',
    'to', 'neg', 'land', 'lor', 'bar', 'vec',
    'left', 'right',
  ].sort((a, b) => b.length - a.length)
  const regex = new RegExp('(?<!\\\\)((?<![a-zA-Z0-9\\\\])[+-]\\s*)?\\\\((' + [...new Set(knownCmds)].join('|') + '))', 'gi')
  
  let result = ''
  let lastIdx = 0
  let match
  
  while ((match = regex.exec(fixed)) !== null) {
    const matchIdx = match.index
    
    // Controlla se il match cade all'interno di un blocco matematico già delimitato
    if (isIndexInRanges(matchIdx, ranges)) {
      continue
    }
    
    const sign = match[1] || ''
    const cmd = match[2]
    const backslashIdx = matchIdx + sign.length
    const endIdx = consumeLatexExpression(fixed, backslashIdx, cmd.length)
    const latexExpr = fixed.slice(backslashIdx, endIdx)
    
    result += fixed.slice(lastIdx, matchIdx)
    result += '$' + sign + latexExpr + '$'
    lastIdx = endIdx
    regex.lastIndex = endIdx
  }
  
  result += fixed.slice(lastIdx)
  fixed = result

  // 4. Clean up any accidental triple dollar delimiters
  fixed = fixed.replace(/\${3,}/g, '$$$$')

  // 5. Detect orphaned \end{env}$$ without matching \begin{env}
  // AI sometimes produces aligned/cases blocks missing the opening \begin{env}
  // Must run AFTER cleanup to avoid newly-inserted $$ being stripped
  {
    const blockEnvs = ['aligned', 'cases', 'gathered', 'split', 'gather', 'matrix', 'pmatrix', 'vmatrix', 'bmatrix', 'Bmatrix', 'Vmatrix']
    type Fix = { pos: number; env: string }
    const fixes: Fix[] = []

    for (const env of blockEnvs) {
      const endRegex = new RegExp('\\\\end\\{' + env + '\\}\\s*\\$\\$', 'g')
      let endMatch

      while ((endMatch = endRegex.exec(fixed)) !== null) {
        const endPos = endMatch.index

        // Find boundary: nearest preceding $$ (close of another block) or start of text
        const lastDollar = fixed.lastIndexOf('$$', endPos - 1)
        let boundary: number
        let region: string
        if (lastDollar !== -1) {
          boundary = lastDollar + 2
          region = fixed.slice(boundary, endPos)
        } else {
          boundary = 0
          region = fixed.slice(0, endPos)
        }

        // Only orphaned if no matching \begin{env} in the region
        const beginRegex = new RegExp('\\\\begin\\{' + env + '\\}')
        if (!beginRegex.test(region)) {
          fixes.push({ pos: boundary, env })
        }
      }
    }

    // Apply fixes in reverse order so earlier positions stay valid
    for (let i = fixes.length - 1; i >= 0; i--) {
      const { pos, env } = fixes[i]
      fixed = fixed.slice(0, pos) + '$$\\begin{' + env + '}\n' + fixed.slice(pos)
    }
  }

  return fixed
}
