import { describe, it, expect } from 'vitest'
import { parseExplanation, healLaTeX } from '@/lib/utils'

describe('parseExplanation', () => {
  describe('JSON format', () => {
    it('parses valid JSON with passi', () => {
      const input = JSON.stringify({
        titolo: 'Derivata di funzione',
        passi: [
          { titolo: 'Identificazione', corpo: 'La funzione è $f(x) = x^2$' },
          { titolo: 'Applicazione regola', corpo: 'Usiamo $\\frac{d}{dx}x^n = nx^{n-1}$' },
        ],
        finale: '$f\'(x) = 2x$',
      })

      const result = parseExplanation(input)
      expect(result.titolo).toBe('Derivata di funzione')
      expect(result.passi).toHaveLength(2)
      expect(result.passi[0].titolo).toBe('Identificazione')
      expect(result.passi[0].corpo).toBe('La funzione è $f(x) = x^2$')
      expect(result.passi[1].titolo).toBe('Applicazione regola')
    })

    it('heals missing backslashes for trig, log, frac, sqrt, and cdot inside math blocks', () => {
      expect(healLaTeX('derivata di $x^2 cdot sin x$')).toBe('derivata di $x^2 \\cdot \\sin x$')
      expect(healLaTeX('calcola $lim_{x \\to 0} frac{sin x}{x}$')).toBe('calcola $\\lim_{x \\to 0} \\frac{\\sin x}{x}$')
      expect(healLaTeX('funzione $log x + ln y$')).toBe('funzione $\\log x + \\ln y$')
      expect(healLaTeX('radice $sqrt{x}$')).toBe('radice $\\sqrt{x}$')
    })

    it('does not touch standard words that contain math command names as substrings', () => {
      expect(healLaTeX('La cosa singola ha un limite costoso')).toBe('La cosa singola ha un limite costoso')
      expect(healLaTeX('Un frullato di lamponi')).toBe('Un frullato di lamponi')
    })

    it('handles JSON with display math $$...$$ in corpo', () => {
      const input = JSON.stringify({
        passi: [{
          titolo: 'Calcolo del limite',
          corpo: 'Applico il limite notevole:\n$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$\nQuindi il risultato è 1.',
        }],
        finale: '$$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$$',
      })
      const result = parseExplanation(input)
      expect(result.passi[0].corpo).toContain('$$')
      expect(result.passi[0].corpo).toContain('\\sin')
      expect(result.finale).toContain('$$')
      expect(result.finale).toContain('\\lim')
    })

    it('handles JSON with \\begin{aligned} multi-line LaTeX', () => {
      const input = JSON.stringify({
        passi: [{
          titolo: 'Risoluzione equazione',
          corpo: '$$\\begin{aligned}\n2x + 3 &= 7 \\\\\n2x &= 4 \\\\\nx &= 2\n\\end{aligned}$$',
        }],
        finale: '$x = 2$',
      })
      const result = parseExplanation(input)
      expect(result.passi[0].corpo).toContain('\\begin{aligned}')
      expect(result.passi[0].corpo).toContain('\\end{aligned}')
      expect(result.passi[0].corpo).toContain('\\\\')
    })

    it('handles JSON with wrong delimiter \\[...\\] (should be converted to $$...$$)', () => {
      const input = JSON.stringify({
        passi: [{
          titolo: 'Integrale',
          corpo: '\\[ \\int_{0}^{1} x^2 \\, dx \\]',
        }],
      })
      const result = parseExplanation(input)
      expect(result.passi[0].corpo).toBe('$$ \\int_{0}^{1} x^2 \\, dx $$')
    })

    it('handles JSON with wrong delimiter \\(...\\) (should be converted to $...$)', () => {
      const input = JSON.stringify({
        passi: [{
          titolo: 'Formula',
          corpo: 'La formula è \\( E = mc^2 \\)',
        }],
      })
      const result = parseExplanation(input)
      expect(result.passi[0].corpo).toBe('La formula è $ E = mc^2 $')
    })

    it('handles JSON with complex LaTeX (frazioni, integrali, limiti)', () => {
      const input = JSON.stringify({
        passi: [{
          titolo: 'Calcolo derivata',
          corpo: '$$\\frac{d}{dx}\\left(\\frac{\\sin x}{x}\\right) = \\frac{x \\cos x - \\sin x}{x^2}$$',
        }, {
          titolo: 'Verifica',
          corpo: 'Per $x \\to 0$, il limite è $\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$',
        }],
        finale: '$$\\frac{d}{dx}\\left(\\frac{\\sin x}{x}\\right) = \\frac{x \\cos x - \\sin x}{x^2}$$',
      })
      const result = parseExplanation(input)
      expect(result.passi).toHaveLength(2)
      expect(result.passi[0].corpo).toContain('\\frac')
      expect(result.passi[0].corpo).toContain('\\sin')
      expect(result.passi[0].corpo).toContain('\\cos')
      expect(result.passi[1].corpo).toContain('\\lim')
    })

    it('handles JSON with LaTeX in titolo', () => {
      const input = JSON.stringify({
        passi: [{
          titolo: '$\\int \\sin x \\, dx$',
          corpo: 'Calcoliamo l\'integrale di $\\sin x$',
        }],
      })
      const result = parseExplanation(input)
      expect(result.passi[0].titolo).toContain('\\int')
      expect(result.passi[0].titolo).toContain('\\sin')
    })

    it('handles JSON with LaTeX in finale', () => {
      const input = JSON.stringify({
        passi: [{ titolo: 'Passo', corpo: 'Corpo' }],
        finale: '$$\\boxed{\\int_{0}^{\\pi} \\sin x \\, dx = 2}$$',
      })
      const result = parseExplanation(input)
      expect(result.finale).toContain('\\boxed')
      expect(result.finale).toContain('\\int')
    })

    it('preserves LaTeX formatting when JSON has \\n in strings', () => {
      const input = JSON.stringify({
        passi: [{
          titolo: 'Scomposizione',
          corpo: 'Primo passaggio:\\n\\n$$a^2 - b^2 = (a-b)(a+b)$$\\n\\nQuindi possiamo scomporre.',
        }],
      })
      const result = parseExplanation(input)
      expect(result.passi[0].corpo).toContain('$$')
      expect(result.passi[0].corpo).toContain('a^2')
    })

    it('handles JSON wrapped in markdown code block', () => {
      const input = '```json\n{"passi":[{"titolo":"Passo 1","corpo":"$x^2$"}]}\n```'
      const result = parseExplanation(input)
      expect(result.passi).toHaveLength(1)
      expect(result.passi[0].corpo).toBe('$x^2$')
    })

    it('handles JSON with text before and after', () => {
      const input = 'Ecco la risposta:\n{"passi":[{"titolo":"P1","corpo":"$x$"}]}\nSpero sia utile!'
      const result = parseExplanation(input)
      expect(result.passi).toHaveLength(1)
    })

    it('handles JSON with empty corpo string', () => {
      const input = JSON.stringify({
        passi: [{ titolo: 'Solo titolo', corpo: '' }],
      })
      const result = parseExplanation(input)
      expect(result.passi[0].corpo).toBe('')
    })

    it('handles JSON with many passi (8 passi)', () => {
      const passi = Array.from({ length: 8 }, (_, i) => ({
        titolo: `Passo ${i + 1}`,
        corpo: `$$f_{${i + 1}}(x) = x^{${i + 1}}$$`,
      }))
      const input = JSON.stringify({ passi })
      const result = parseExplanation(input)
      expect(result.passi).toHaveLength(8)
      result.passi.forEach((p, i) => {
        expect(p.titolo).toBe(`Passo ${i + 1}`)
        expect(p.corpo).toContain('$$')
      })
    })

    it('preserves LaTeX with special characters: \\alpha, \\beta, \\gamma', () => {
      const input = JSON.stringify({
        passi: [{
          titolo: 'Angoli',
          corpo: '$\\alpha + \\beta + \\gamma = \\pi$ radianti',
        }],
      })
      const result = parseExplanation(input)
      expect(result.passi[0].corpo).toContain('\\alpha')
      expect(result.passi[0].corpo).toContain('\\beta')
      expect(result.passi[0].corpo).toContain('\\gamma')
    })

    it('preserves LaTeX with \\sum and \\prod notations', () => {
      const input = JSON.stringify({
        passi: [{
          titolo: 'Serie',
          corpo: '$$\\sum_{n=1}^{\\infty} \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$',
        }, {
          titolo: 'Prodotto',
          corpo: '$$\\prod_{k=1}^{n} k = n!$$',
        }],
      })
      const result = parseExplanation(input)
      expect(result.passi[0].corpo).toContain('\\sum')
      expect(result.passi[1].corpo).toContain('\\prod')
    })

    it('preserves LaTeX with \\sqrt, \\underset, \\overset', () => {
      const input = JSON.stringify({
        passi: [{
          titolo: 'Radice',
          corpo: '$\\sqrt[3]{x^2 + y^2}$ e $\\underset{x \\to 0}{\\lim} f(x)$',
        }],
      })
      const result = parseExplanation(input)
      expect(result.passi[0].corpo).toContain('\\sqrt[3]')
      expect(result.passi[0].corpo).toContain('\\underset')
    })
  })

  describe('JSON format — edge cases and error recovery', () => {
    it('falls back to legacy when passi array is empty', () => {
      const input = JSON.stringify({ titolo: 'Test', passi: [] })
      const result = parseExplanation(input)
      expect(result.titolo).toBe('')
      expect(result.passi).toHaveLength(0)
      expect(result.finale).toBe('')
    })

    it('falls back to legacy when passi is not an array', () => {
      const input = JSON.stringify({ titolo: 'Test', passi: 'not-an-array' })
      const result = parseExplanation(input)
      expect(result.passi).toHaveLength(0)
    })

    it('falls back to legacy on malformed JSON', () => {
      const input = '{broken json}'
      const result = parseExplanation(input)
      expect(result.passi).toHaveLength(0)
    })

    it('falls back to legacy when JSON is truncated', () => {
      const input = '{"passi":[{"titolo":"P1","corpo":"C1"}'
      const result = parseExplanation(input)
      expect(result.passi).toHaveLength(0)
    })

    it('handles AI output with multiple JSON-like objects (picks the first valid JSON match)', () => {
      const input = '{"passi":[{"titolo":"Prima","corpo":"$x$"}]} tra due oggetti {"passi":[{"titolo":"Seconda","corpo":"$y$"}]}'
      const result = parseExplanation(input)
      // findJSON bilancia le graffe e trova con successo il primo JSON valido
      expect(result.passi).toHaveLength(1)
      expect(result.passi[0].titolo).toBe('Prima')
      expect(result.passi[0].corpo).toBe('$x$')
    })
  })

  describe('JSON format — security and edge inputs', () => {
    it('handles null byte in input (falls back to legacy since JSON is invalid)', () => {
      const input = '{"passi":[{"titolo":"Test","corpo":"$x$\0"}]}'
      const result = parseExplanation(input)
      // Null byte makes JSON.parse fail, falls back to legacy
      expect(result.passi).toHaveLength(0)
    })

    it('handles extremely long titolo', () => {
      const longTitle = 'A'.repeat(1000)
      const input = JSON.stringify({ passi: [{ titolo: longTitle, corpo: '$x$' }] })
      const result = parseExplanation(input)
      expect(result.passi[0].titolo).toHaveLength(1000)
    })

    it('handles JSON with extra unknown fields', () => {
      const input = JSON.stringify({
        passi: [{ titolo: 'P1', corpo: '$x$' }],
        extra_field: 'ignorami',
        altro_numero: 42,
      })
      const result = parseExplanation(input)
      expect(result.passi).toHaveLength(1)
    })
  })

  describe('Legacy format — with LaTeX content', () => {
    it('parses TITOLO, PASSI and RISPOSTA FINALE markers', () => {
      const input = [
        'TITOLO: Limite notevole',
        'PASSO 1: Riscrittura',
        'Riscriviamo il limite nella forma $\\frac{\\sin x}{x}$',
        'PASSO 2: Applicazione',
        'Applichiamo il limite notevole',
        'RISPOSTA FINALE: $1$',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.titolo).toBe('Limite notevole')
      expect(result.passi).toHaveLength(2)
      expect(result.passi[0].titolo).toBe('Riscrittura')
      expect(result.passi[0].corpo).toBe('Riscriviamo il limite nella forma $\\frac{\\sin x}{x}$')
      expect(result.passi[1].titolo).toBe('Applicazione')
      expect(result.finale).toBe('$1$')
    })

    it('handles PASSO with display math $$...$$ in corpo', () => {
      const input = [
        'PASSO 1: Calcolo',
        '$$\\int_{0}^{1} x^2 \\, dx = \\left[\\frac{x^3}{3}\\right]_{0}^{1}$$',
        'Quindi il risultato è $\\frac{1}{3}$',
        'RISPOSTA FINALE: $$\\frac{1}{3}$$',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.passi[0].corpo).toContain('$$')
      expect(result.passi[0].corpo).toContain('\\int')
      expect(result.finale).toContain('$$')
    })

    it('handles PASSO with \\begin{aligned} multi-line LaTeX', () => {
      const input = [
        'PASSO 1: Svolgimento',
        '$$\\begin{aligned}',
        '\\frac{d}{dx}[x^2] &= 2x \\\\',
        '\\frac{d}{dx}[\\sin x] &= \\cos x',
        '\\end{aligned}$$',
        'RISPOSTA FINALE: $f\'(x) = 2x + \\cos x$',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.passi[0].corpo).toContain('\\begin{aligned}')
      expect(result.passi[0].corpo).toContain('\\end{aligned}')
      expect(result.passi[0].corpo).toContain('\\\\')
    })

    it('handles RISPOSTA FINALE with \\boxed LaTeX', () => {
      const input = [
        'PASSO 1: Calcolo',
        'Eseguo il calcolo',
        'RISPOSTA FINALE: $$\\boxed{\\int_{0}^{\\pi} \\sin x \\, dx = 2}$$',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.finale).toContain('\\boxed')
      expect(result.finale).toContain('\\int')
    })

    it('handles multi-line RISPOSTA FINALE with LaTeX', () => {
      const input = [
        'PASSO 1: Passo',
        'Corpo',
        'RISPOSTA FINALE: $$\\begin{aligned}',
        'x &= \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\\\',
        'x_1 &= 2, \\quad x_2 = -3',
        '\\end{aligned}$$',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.finale).toContain('\\begin{aligned}')
      expect(result.finale).toContain('\\end{aligned}')
      expect(result.finale).toContain('x_1')
      expect(result.finale).toContain('x_2')
    })

    it('handles TITOLO with LaTeX', () => {
      const input = [
        'TITOLO: Studio della funzione $f(x) = x^3 - 3x$',
        'PASSO 1: Dominio',
        'La funzione è definita su $\\mathbb{R}$',
        'RISPOSTA FINALE: $x \\in \\mathbb{R}$',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.titolo).toContain('$f(x)')
      expect(result.titolo).toContain('x^3')
    })

    it('preserves LaTeX with \\sin, \\cos, \\tan in legacy format', () => {
      const input = [
        'PASSO 1: Trigonometria',
        '$\\sin^2 x + \\cos^2 x = 1$ e $\\tan x = \\frac{\\sin x}{\\cos x}$',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.passi[0].corpo).toContain('\\sin')
      expect(result.passi[0].corpo).toContain('\\cos')
      expect(result.passi[0].corpo).toContain('\\tan')
    })

    it('preserves mixed $ and $$ in same passo body', () => {
      const input = [
        'PASSO 1: Passo misto',
        'La formula $$E = mc^2$$ è famosa, ma anche $F = ma$ lo è.',
      ].join('\n')

      const result = parseExplanation(input)
      const corpo = result.passi[0].corpo
      // Contiene entrambi i tipi di delimitatori LaTeX
      expect(corpo).toContain('$$E = mc^2$$')
      expect(corpo).toContain('$F = ma$')
      expect(corpo.match(/\$\$/g)).toHaveLength(2) // due $$ di apertura e due di chiusura
    })
  })

  describe('Legacy format — edge cases', () => {
    it('handles empty input', () => {
      const result = parseExplanation('')
      expect(result.titolo).toBe('')
      expect(result.passi).toHaveLength(0)
      expect(result.finale).toBe('')
    })

    it('handles input without any markers', () => {
      const result = parseExplanation('testo generico senza marker')
      expect(result.titolo).toBe('')
      expect(result.passi).toHaveLength(0)
      expect(result.finale).toBe('')
    })

    it('parses multiple passi correctly', () => {
      const input = [
        'PASSO 1: Primo',
        'Contenuto primo',
        'PASSO 2: Secondo',
        'Contenuto secondo',
        'PASSO 3: Terzo',
        'Contenuto terzo',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.passi).toHaveLength(3)
      expect(result.passi[0].titolo).toBe('Primo')
      expect(result.passi[1].titolo).toBe('Secondo')
      expect(result.passi[2].titolo).toBe('Terzo')
    })

    it('handles RISPOSTA FINALE on same line as marker', () => {
      const input = [
        'PASSO 1: Passo',
        'Corpo',
        'RISPOSTA FINALE: Risposta inline',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.finale).toBe('Risposta inline')
    })

    it('handles multi-line RISPOSTA FINALE', () => {
      const input = [
        'PASSO 1: Passo',
        'Corpo',
        'RISPOSTA FINALE: Prima riga',
        'Seconda riga',
        'Terza riga',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.finale).toBe('Prima riga\nSeconda riga\nTerza riga')
    })

    it('does not confuse RISPOSTA FINALE marker inside corpo text', () => {
      const input = [
        'PASSO 1: Passo',
        'La risposta finale è $x=2$',
        'PASSO 2: Verifica',
        'Verifichiamo',
        'RISPOSTA FINALE: $x=2$',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.passi).toHaveLength(2)
      expect(result.finale).toBe('$x=2$')
    })
  })

  describe('Mixed content — AI often produces these', () => {
    it('handles JSON-like text that exists inside legacy format body', () => {
      const input = [
        'PASSO 1: Esempio',
        'Il risultato è un oggetto come {"chiave": "valore"} ma non è JSON',
        'RISPOSTA FINALE: OK',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.passi).toHaveLength(1)
      expect(result.passi[0].corpo).toContain('{"chiave"')
      expect(result.finale).toBe('OK')
    })

    it('handles legacy format where passo title contains a number with colon', () => {
      const input = [
        'PASSO 1: Teorema 1: Enunciato',
        'Il teorema afferma che $a^2 + b^2 = c^2$',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.passi[0].titolo).toContain('Teorema 1: Enunciato')
    })

    it('handles PASSO marker directly followed by newline (no title)', () => {
      const input = [
        'PASSO 1:',
        'Corpo del passo senza titolo',
      ].join('\n')

      const result = parseExplanation(input)
      expect(result.passi[0].titolo).toBe('')
      expect(result.passi[0].corpo).toBe('Corpo del passo senza titolo')
    })
  })

  describe('Streaming format', () => {
    it('parses streaming JSON with escaped backslashes', () => {
      const input = '{"passi":[{"titolo":"Passo 1","corpo":"x-2 = 0 \\\\Rightarrow x = 2"}]'
      const result = parseExplanation(input, true)
      expect(result.passi).toHaveLength(1)
      expect(result.passi[0].corpo).toBe('x-2 = 0 $\\Rightarrow$ x = 2')
    })

    it('parses complete streaming JSON', () => {
      const input = '{"passi":[{"titolo":"Passo 1","corpo":"x-2 = 0 \\\\Rightarrow x = 2"}]}'
      const result = parseExplanation(input, true)
      expect(result.passi).toHaveLength(1)
      expect(result.passi[0].corpo).toBe('x-2 = 0 $\\Rightarrow$ x = 2')
    })
  })

  describe('healLaTeX utility', () => {
    it('normalizes missing backslashes on arrow commands', () => {
      expect(healLaTeX('x - 2 = 0Rightarrowx = 2')).toBe('x - 2 = 0$\\Rightarrow$x = 2')
      expect(healLaTeX('otteniamo rightarrow fine')).toBe('otteniamo $\\rightarrow$ fine')
      expect(healLaTeX('con \\Leftrightarrow ok')).toBe('con $\\Leftrightarrow$ ok')
    })

    it('wraps unescaped math commands in math delimiters', () => {
      expect(healLaTeX('Risolvendo \\Rightarrow e \\pm')).toBe('Risolvendo $\\Rightarrow$ e $\\pm$')
    })

    it('does not double wrap already wrapped math commands', () => {
      expect(healLaTeX('La formula è $\\alpha$')).toBe('La formula è $\\alpha$')
      expect(healLaTeX('Abbiamo $\\beta + \\gamma$')).toBe('Abbiamo $\\beta + \\gamma$')
    })

    it('heals un-delimited equations and arrows in parsing results', () => {
      const input = JSON.stringify({
        passi: [{
          titolo: 'Equazione',
          corpo: 'Risolvendo (x - 2) = 0 e (x + 2) = 0 separatamente, otteniamo: x - 2 = 0Rightarrowx = 2 e x + 2 = 0Rightarrowx = -2',
        }],
      })
      const result = parseExplanation(input)
      expect(result.passi[0].corpo).toBe('Risolvendo (x - 2) = 0 e (x + 2) = 0 separatamente, otteniamo: x - 2 = 0$\\Rightarrow$x = 2 e x + 2 = 0$\\Rightarrow$x = -2')
    })

    it('normalizes infinity symbol representations and wraps them correctly', () => {
      expect(healLaTeX('tende a +infinito')).toBe('tende a $+\\infty$')
      expect(healLaTeX('tende a - infinito')).toBe('tende a $-\\infty$')
      expect(healLaTeX('tende a più infinito')).toBe('tende a $+\\infty$')
      expect(healLaTeX('tende a meno infinito')).toBe('tende a $-\\infty$')
      expect(healLaTeX('tende a infinito')).toBe('tende a $\\infty$')
      expect(healLaTeX('tende a +infty')).toBe('tende a $+\\infty$')
      expect(healLaTeX('tende a - infty')).toBe('tende a $-\\infty$')
      expect(healLaTeX('tende a infty')).toBe('tende a $\\infty$')
      expect(healLaTeX('il limite è $\\lim_{x \\to +infinito}$')).toBe('il limite è $\\lim_{x \\to +\\infty}$')
      expect(healLaTeX('il limite è $\\lim_{x \\to -infty}$')).toBe('il limite è $\\lim_{x \\to -\\infty}$')
    })

    it('normalizes missing backslashes and wraps pm, neq, le, ge correctly', () => {
      expect(healLaTeX('quando x o pm infinito')).toBe('quando x o $\\pm$ $\\infty$')
      expect(healLaTeX('se x o pm infty')).toBe('se x o $\\pm$ $\\infty$')
      expect(healLaTeX('valore neq 0')).toBe('valore $\\neq$ 0')
      expect(healLaTeX('se a \\le b e b \\ge c')).toBe('se a $\\le$ b e b $\\ge$ c')
      expect(healLaTeX('quando $x \\to \\pm \\infty$')).toBe('quando $x \\to \\pm \\infty$')
    })

    it('heals missing backslashes in begin/end math environments', () => {
      expect(healLaTeX('$$\\begin{aligned}\ny &= x^3\nend{aligned}$$')).toBe('$$\\begin{aligned}\ny &= x^3\n\\end{aligned}$$')
      expect(healLaTeX('$$begin{aligned}\ny &= x^3\nend{aligned}$$')).toBe('$$\\begin{aligned}\ny &= x^3\n\\end{aligned}$$')
      expect(healLaTeX('se begin{cases} x > 0 \\\\ x < 0 end{cases}')).toBe('se \\begin{cases} x > 0 \\\\ x < 0 \\end{cases}')
      expect(healLaTeX('se begin{vmatrix} a & b \\\\ c & d end{vmatrix}')).toBe('se \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}')
      expect(healLaTeX('se begin{bmatrix} 1 & 0 \\\\ 0 & 1 end{bmatrix}')).toBe('se \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}')
      expect(healLaTeX('begin{gather} x + y \\\\ a - b end{gather}')).toBe('\\begin{gather} x + y \\\\ a - b \\end{gather}')
      expect(healLaTeX('begin{split} x + y end{split}')).toBe('\\begin{split} x + y \\end{split}')
    })

    it('heals orphaned \\end{env}$$ when \\begin{env} is completely missing', () => {
      // User's case: aligned content without opening
      expect(healLaTeX('&= a \\\\ &= b \\end{aligned}$$'))
        .toBe('$$\\begin{aligned}\n&= a \\\\ &= b \\end{aligned}$$')
      // cases environment
      expect(healLaTeX('x = 0 \\\\ x = 1 \\end{cases}$$'))
        .toBe('$$\\begin{cases}\nx = 0 \\\\ x = 1 \\end{cases}$$')
      // After another math block
      expect(healLaTeX('$$x^2$$ &= c \\\\ &= d \\end{aligned}$$'))
        .toBe('$$x^2$$$$\\begin{aligned}\n &= c \\\\ &= d \\end{aligned}$$')
      // gather environment
      expect(healLaTeX('a + b \\\\ c - d \\end{gather}$$'))
        .toBe('$$\\begin{gather}\na + b \\\\ c - d \\end{gather}$$')
      // bmatrix environment
      expect(healLaTeX('1 & 2 \\\\ 3 & 4 \\end{bmatrix}$$'))
        .toBe('$$\\begin{bmatrix}\n1 & 2 \\\\ 3 & 4 \\end{bmatrix}$$')
      // NOT orphaned: has matching \begin{aligned}
      expect(healLaTeX('$$\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}$$'))
        .toBe('$$\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}$$')
      // NOT orphaned: cases with matching begin
      expect(healLaTeX('$$\\begin{cases} x > 0 \\\\ x < 0 \\end{cases}$$'))
        .toBe('$$\\begin{cases} x > 0 \\\\ x < 0 \\end{cases}$$')
    })

    it('heals complex un-delimited LaTeX commands and parameters', () => {
      expect(healLaTeX('la derivata è \\frac{d}{dx}x^2 = 2x')).toBe('la derivata è $\\frac{d}{dx}$x^2 = 2x')
      expect(healLaTeX('il limite è \\lim_{x \\to 0} f(x)')).toBe('il limite è $\\lim_{x \\to 0}$ f(x)')
      expect(healLaTeX('la somma è \\sum_{i=1}^{n} i')).toBe('la somma è $\\sum_{i=1}^{n}$ i')
      expect(healLaTeX('l\'integrale è \\int_{0}^{1} x^2 \\, dx')).toBe('l\'integrale è $\\int_{0}^{1}$ x^2 \\, dx')
      expect(healLaTeX('la radice è \\sqrt[3]{x^2 + y^2}')).toBe('la radice è $\\sqrt[3]{x^2 + y^2}$')
      expect(healLaTeX('il valore è \\boxed{10}')).toBe('il valore è $\\boxed{10}$')
    })

    it('does not double wrap or touch commands inside math blocks', () => {
      expect(healLaTeX('$$\\frac{1}{2}$$')).toBe('$$\\frac{1}{2}$$')
      expect(healLaTeX('$\\lim_{x \\to 0} f(x)$')).toBe('$\\lim_{x \\to 0} f(x)$')
      expect(healLaTeX('La formula è $E = mc^2$ e poi $\\alpha$')).toBe('La formula è $E = mc^2$ e poi $\\alpha$')
    })

    it('heals corrupted control characters from unescaped JSON backslashes', () => {
      expect(healLaTeX('\x0crac{partial}{partial x}(x^2 + xy) = 2x + y')).toBe('$\\frac{\\partial}{\\partial x}$(x^2 + xy) = 2x + y')
      expect(healLaTeX('quando x o \x08eta')).toBe('quando x o $\\beta$')
      expect(healLaTeX('valore \x09imes y')).toBe('valore $\\times$ y')
      expect(healLaTeX('quando \x0aeq 0')).toBe('quando $\\neq$ 0')
    })

    it('handles \\frac{partial}{partial x} → \\frac{\\partial}{\\partial x} (partial derivative)', () => {
      expect(healLaTeX('\\frac{partial}{partial x}(x^2 + xy) = 2x + y')).toBe('$\\frac{\\partial}{\\partial x}$(x^2 + xy) = 2x + y')
      expect(healLaTeX('\\frac{\\partial}{partial x}f = 2x + y')).toBe('$\\frac{\\partial}{\\partial x}$f = 2x + y')
      expect(healLaTeX('\\frac{partial}{\\partial x}f = 2x + y')).toBe('$\\frac{\\partial}{\\partial x}$f = 2x + y')
    })

    describe('comprehensive mathematical domains', () => {
      it('heals algebra, set theory, and logic symbols with and without backslashes', () => {
        // Unescaped symbols that get healed with backslashes and wrapped
        expect(healLaTeX('se a \\le b e b \\ge c allora a pm c')).toBe('se a $\\le$ b e b $\\ge$ c allora a $\\pm$ c')
        expect(healLaTeX('x neq y')).toBe('x $\\neq$ y')
        expect(healLaTeX('derivata partial')).toBe('derivata $\\partial$')
        
        // Standalone commands (with backslashes) that get wrapped
        expect(healLaTeX('x \\in \\mathbb{R} e y \\notin \\mathbb{N}')).toBe('x $\\in$ $\\mathbb{R}$ e y $\\notin$ $\\mathbb{N}$')
        expect(healLaTeX('se A \\subset B allora A \\cup B = B')).toBe('se A $\\subset$ B allora A $\\cup$ B = B')
        expect(healLaTeX('per ogni \\forall x \\exists y tale che x \\approx y')).toBe('per ogni $\\forall$ x $\\exists$ y tale che x $\\approx$ y')
        expect(healLaTeX('p \\wedge q \\vee \\neg p')).toBe('p $\\wedge$ q $\\vee$ $\\neg$ p')
        expect(healLaTeX('x \\equiv y')).toBe('x $\\equiv$ y')
      })

      it('heals mathematical constants and symbols', () => {
        expect(healLaTeX('area = \\pi r^2')).toBe('area = $\\pi$ r^2')
        expect(healLaTeX('tende a infinito')).toBe('tende a $\\infty$')
        expect(healLaTeX('limite per x \\to \\infty')).toBe('limite per x $\\to$ $\\infty$')
        expect(healLaTeX('tende a +infinito')).toBe('tende a $+\\infty$')
        expect(healLaTeX('tende a -infty')).toBe('tende a $-\\infty$')
        expect(healLaTeX('\\nabla f = 0')).toBe('$\\nabla$ f = 0')
      })

      it('does not corrupt Italian common words like le, ge, to, or words containing them', () => {
        expect(healLaTeX('Considerando le restrizioni analizzate')).toBe('Considerando le restrizioni analizzate')
        expect(healLaTeX('Benvenuti a torino')).toBe('Benvenuti a torino')
        expect(healLaTeX('Il valore totale delle funzioni')).toBe('Il valore totale delle funzioni')
      })

      it('does not corrupt Italian words with accented vowels that contain LaTeX command substrings', () => {
        expect(healLaTeX('così otteniamo il risultato')).toBe('così otteniamo il risultato')
        expect(healLaTeX('più precisamente si ha')).toBe('più precisamente si ha')
        expect(healLaTeX('è necessario calcolare il limite')).toBe('è necessario calcolare il limite')
        expect(healLaTeX('sarà utile ricordare che')).toBe('sarà utile ricordare che')
        expect(healLaTeX('la funzione è così definita')).toBe('la funzione è così definita')
      })

      it('heals calculus, integrals, and limits (with backslashes)', () => {
        expect(healLaTeX('calcola \\int x^2 dx')).toBe('calcola $\\int$ x^2 dx')
        expect(healLaTeX('integrale doppio \\iint_D f(x,y) dx dy')).toBe('integrale doppio $\\iint_D$ f(x,y) dx dy')
        expect(healLaTeX('integrale di linea \\oint_C F dr')).toBe('integrale di linea $\\oint_C$ F dr')
        expect(healLaTeX('sommatoria \\sum_{i=1}^n i')).toBe('sommatoria $\\sum_{i=1}^n$ i')
        expect(healLaTeX('produttoria \\prod_{k=1}^m k')).toBe('produttoria $\\prod_{k=1}^m$ k')
        expect(healLaTeX('limite \\lim_{x \\to 0} \\frac{\\sin x}{x}')).toBe('limite $\\lim_{x \\to 0}$ $\\frac{\\sin x}{x}$')
      })

      it('heals trigonometry and geometry (with backslashes)', () => {
        expect(healLaTeX('\\sin(\\theta) = \\cos(\\theta) quando \\theta = \\pi / 4')).toBe('$\\sin$($\\theta$) = $\\cos$($\\theta$) quando $\\theta$ = $\\pi$ / 4')
        expect(healLaTeX('\\tan(\\alpha) = \\sin(\\alpha) / \\cos(\\alpha)')).toBe('$\\tan$($\\alpha$) = $\\sin$($\\alpha$) / $\\cos$($\\alpha$)')
      })

      it('heals combinations and binomial coefficients (with backslashes)', () => {
        expect(healLaTeX('coefficiente binomiale \\binom{n}{k}')).toBe('coefficiente binomiale $\\binom{n}{k}$')
      })
    })
  })
})

