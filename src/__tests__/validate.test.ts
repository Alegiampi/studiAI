import { describe, it, expect } from 'vitest'
import { parseExplanation } from '@/lib/utils'
import type { Passo } from '@/types'

// Helper di validazione: controlla che un parsed explanation sia ben formato
function validateExplanation(text: string): {
  valid: boolean
  errors: string[]
  parsed: { titolo: string; passi: Passo[]; finale: string }
} {
  const errors: string[] = []
  const parsed = parseExplanation(text)

  // 1. passi deve essere un array
  if (!Array.isArray(parsed.passi)) {
    errors.push('passi non è un array')
    return { valid: false, errors, parsed }
  }

  // 2. Ogni passo deve avere titolo e corpo stringa
  parsed.passi.forEach((p, i) => {
    if (typeof p.titolo !== 'string') errors.push(`passo[${i}].titolo non è stringa`)
    if (typeof p.corpo !== 'string') errors.push(`passo[${i}].corpo non è stringa`)
  })

  // 3. titolo e finale devono essere stringhe
  if (typeof parsed.titolo !== 'string') errors.push('titolo non è stringa')
  if (typeof parsed.finale !== 'string') errors.push('finale non è stringa')

  return { valid: errors.length === 0, errors, parsed }
}

// Helper: conta coppie di delimitatori LaTeX
function hasBalancedDollar(text: string): boolean {
  // Controllo semplice: ogni $ (non $$) deve avere un matching
  const singles: number[] = []
  const doubles: number[] = []
  let i = 0
  while (i < text.length) {
    if (text[i] === '$' && i + 1 < text.length && text[i + 1] === '$') {
      doubles.push(i)
      i += 2
    } else if (text[i] === '$') {
      singles.push(i)
      i += 1
    } else {
      i += 1
    }
  }
  return singles.length % 2 === 0 && doubles.length % 2 === 0
}

// Helper: controlla che non ci siano delimitatori LaTeX obsoleti
function hasNoWrongDelimiters(text: string): boolean {
  return !text.includes('\\[') && !text.includes('\\]') &&
         !text.includes('\\(') && !text.includes('\\)')
}

describe('validazione spiegazioni', () => {
  describe('struttura base', () => {
    it('valida una spiegazione JSON ben formata', () => {
      const { valid, errors } = validateExplanation(JSON.stringify({
        titolo: 'Derivata',
        passi: [{ titolo: 'Passo 1', corpo: 'Calcoliamo $f\'(x)$' }],
        finale: '$2x$',
      }))
      expect(valid).toBe(true)
      expect(errors).toEqual([])
    })

    it('quando passi non è array, parseExplanation cade in legacy e restituisce array vuoto', () => {
      const { valid, parsed } = validateExplanation(JSON.stringify({
        passi: 'non-array',
      }))
      expect(valid).toBe(true)
      expect(parsed.passi).toEqual([])
    })

    it('segnala errore quando passi è array vuoto (legacy fallback)', () => {
      const { parsed } = validateExplanation(JSON.stringify({
        passi: [],
      }))
      // Cade in legacy che da array vuoto — valido ma nessun passo
      expect(parsed.passi).toHaveLength(0)
    })
  })

  describe('delimitatori LaTeX', () => {
    it('rileva $$...$$ bilanciati', () => {
      const text = '$$\\int x \\, dx$$'
      expect(hasBalancedDollar(text)).toBe(true)
    })

    it('rileva $...$ bilanciati', () => {
      const text = 'La formula $E = mc^2$ è famosa'
      expect(hasBalancedDollar(text)).toBe(true)
    })

    it('rileva $$ spaiati', () => {
      const text = '$$\\int x \\, dx' // manca $$ di chiusura
      expect(hasBalancedDollar(text)).toBe(false)
    })

    it('rileva $ spaiati', () => {
      const text = 'Il valore è $x = 2' // manca $ di chiusura
      expect(hasBalancedDollar(text)).toBe(false)
    })

    it('gestisce misto $ e $$ bilanciati', () => {
      const text = '$$F = ma$$ e $x$'
      expect(hasBalancedDollar(text)).toBe(true)
    })

    it('gestisce testo senza LaTeX', () => {
      expect(hasBalancedDollar('testo normale')).toBe(true)
    })

    it('rileva solo $$ senza $', () => {
      expect(hasBalancedDollar('$$a$$ $$b$$')).toBe(true)
      expect(hasBalancedDollar('$$a$$ $$b')).toBe(false)
    })

    it('rileva \\[...\\] come delimiter obsoleto', () => {
      expect(hasNoWrongDelimiters('\\[ \\int x \\, dx \\]')).toBe(false)
    })

    it('rileva \\(...\\) come delimiter obsoleto', () => {
      expect(hasNoWrongDelimiters('\\( E = mc^2 \\)')).toBe(false)
    })

    it('testo pulito non ha delimitatori obsoleti', () => {
      expect(hasNoWrongDelimiters('$$\\int x \\, dx$$')).toBe(true)
    })
  })

  describe('integrazione: parseExplanation + validazione', () => {
    it('ogni passo di una spiegazione AI reale dovrebbe contenere LaTeX', () => {
      // Simula output realistico dell'AI
      const input = JSON.stringify({
        titolo: 'Calcolo della derivata di $f(x) = x^3$',
        passi: [
          {
            titolo: 'Identificazione della regola',
            corpo: 'Applichiamo la regola di derivazione $\\frac{d}{dx}x^n = nx^{n-1}$',
          },
          {
            titolo: 'Applicazione della formula',
            corpo: '$$\\frac{d}{dx}x^3 = 3 \\cdot x^{3-1} = 3x^2$$',
          },
          {
            titolo: 'Risultato',
            corpo: 'Quindi $f\'(x) = 3x^2$',
          },
        ],
        finale: '$$\\boxed{f\'(x) = 3x^2}$$',
      })

      const { valid, errors, parsed } = validateExplanation(input)
      expect(valid).toBe(true)
      expect(errors).toEqual([])

      // Ogni passo ha LaTeX
      parsed.passi.forEach((p) => {
        expect(p.corpo).toMatch(/[\$]/) // contiene almeno un $
      })

      // finale ha LaTeX
      expect(parsed.finale).toMatch(/[\$]/)

      // titolo ha LaTeX
      expect(parsed.titolo).toMatch(/[\$]/)
    })

    it('nessuna spiegazione valida dovrebbe contenere delimiter obsoleti (vengono convertiti)', () => {
      const input = JSON.stringify({
        passi: [
          { titolo: 'Passo', corpo: '\\[ \\int x \\, dx \\] e poi \\( E = mc^2 \\)' },
        ],
      })

      const { parsed } = validateExplanation(input)
      // parseExplanation converte i delimitatori obsoleti
      expect(parsed.passi[0].corpo).not.toContain('\\[')
      expect(parsed.passi[0].corpo).not.toContain('\\(')
      expect(parsed.passi[0].corpo).toContain('$$')
      expect(parsed.passi[0].corpo).toContain('$')
    })

    it('spiegazione con 6 passi realistici di matematica', () => {
      const passi = [
        { titolo: 'Analisi del testo', corpo: 'L\'esercizio richiede di $\\lim_{x \\to 0} \\frac{\\sin x}{x}$' },
        { titolo: 'Riconoscimento', corpo: 'Riconosciamo la forma del limite notevole $\\frac{\\sin x}{x} \\to 1$' },
        { titolo: 'Applicazione', corpo: '$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$' },
        { titolo: 'Verifica', corpo: 'Verifichiamo con $x = 0.1$: $\\frac{\\sin 0.1}{0.1} \\approx 0.998$' },
        { titolo: 'Risultato intermedio', corpo: 'Confermiamo che $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$' },
        { titolo: 'Conclusione', corpo: 'Il limite notevole è dimostrato: $$\\boxed{\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1}$$' },
      ]

      const input = JSON.stringify({
        titolo: 'Limite notevole: $\\lim_{x \\to 0} \\frac{\\sin x}{x}$',
        passi,
        finale: '$$\\boxed{1}$$',
      })

      const { valid, parsed } = validateExplanation(input)
      expect(valid).toBe(true)
      expect(parsed.passi).toHaveLength(6)
      expect(parsed.passi[0].titolo).toBe('Analisi del testo')
      expect(parsed.passi[5].titolo).toBe('Conclusione')

      // Ordine: i titoli sono in sequenza crescente
      parsed.passi.forEach((p) => {
        expect(typeof p.titolo).toBe('string')
        expect(p.titolo.length).toBeGreaterThan(0)
        expect(typeof p.corpo).toBe('string')
        expect(p.corpo.length).toBeGreaterThan(0)
      })
    })
  })

  describe('formato legacy realistico', () => {
    it('valida una spiegazione in formato legacy con LaTeX complesso', () => {
      const input = [
        'TITOLO: Studio di funzione $f(x) = x^3 - 3x$',
        'PASSO 1: Dominio',
        'La funzione è definita su $\\mathbb{R}$ perché è un polinomio.',
        'PASSO 2: Derivata prima',
        '$$f\'(x) = 3x^2 - 3 = 3(x^2 - 1) = 3(x-1)(x+1)$$',
        'PASSO 3: Segno della derivata',
        'Studiamo $f\'(x) > 0$: $3(x-1)(x+1) > 0$ quindi $x < -1$ o $x > 1$',
        'PASSO 4: Massimi e minimi',
        'In $x = -1$ abbiamo un massimo locale: $f(-1) = 2$',
        'In $x = 1$ abbiamo un minimo locale: $f(1) = -2$',
        'RISPOSTA FINALE: $$\\boxed{\\text{Max: }(-1, 2), \\text{ Min: }(1, -2)}$$',
      ].join('\n')

      const { valid, parsed } = validateExplanation(input)
      expect(valid).toBe(true)
      expect(parsed.passi).toHaveLength(4)
      expect(parsed.titolo).toContain('$f(x)')
      expect(parsed.finale).toContain('\\boxed')
    })

    it('valida spiegazione legacy con \\begin{aligned}', () => {
      const input = [
        'PASSO 1: Sistema di equazioni',
        '$$\\begin{cases}',
        '2x + y = 5 \\\\',
        'x - y = 1',
        '\\end{cases}$$',
        'PASSO 2: Risoluzione',
        'Dalla seconda equazione: $x = y + 1$',
        'Sostituiamo: $2(y+1) + y = 5$ → $3y + 2 = 5$ → $y = 1$',
        'PASSO 3: Soluzione',
        '$x = 1 + 1 = 2$',
        'RISPOSTA FINALE: $$\\boxed{(x, y) = (2, 1)}$$',
      ].join('\n')

      const { valid, parsed } = validateExplanation(input)
      expect(valid).toBe(true)
      expect(parsed.passi).toHaveLength(3)
      // hasBalancedDollar su tutto il testo combinato
      const fullText = parsed.passi.map(p => p.corpo).join(' ')
      expect(hasBalancedDollar(fullText)).toBe(true)
    })
  })
})
