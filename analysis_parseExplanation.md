# Audit completo: `parseExplanation` + `healLaTeX` + `ExplanationRenderer`

Ho analizzato l'intera pipeline dal prompt API → parsing → healing → rendering. Ecco tutto quello che ho trovato, organizzato per gravità.

---

## 🔴 Bug gravi (rompono la visualizzazione)

### 1. `healLaTeX` crea `$` sbilanciati con simboli consecutivi

Quando il testo ha più comandi LaTeX consecutivi fuori da math-mode, ogni comando viene wrappato singolarmente in `$...$`, ma la logica `parts.split('$')` poi confonde i confini.

**Esempio problematico:**
```
Input:   "x Rightarrow y Leftrightarrow z"
Atteso:  "$x \\Rightarrow y \\Leftrightarrow z$"
Ottieni: "x $\\Rightarrow$ y $\\Leftrightarrow$ z"
```

Questo non è necessariamente sbagliato per KaTeX (i singoli wrapping funzionano), ma **genera markup frammentato** che KaTeX renderizza come blocchi separati con spaziatura incoerente. Lo studente vede le frecce come "staccate" dal contesto.

### 2. `healLaTeX` non gestisce `\frac`, `\sqrt`, `\lim`, `\sum` fuori da delimitatori

Il passo 3 (wrapping in `$...$`) ha una lista di comandi hardcoded:
```
\\(Leftrightarrow|...|infty|times|div|alpha|beta|gamma|delta|theta|lambda|mu|pi|sigma|omega)
```

**Mancano** comandi fondamentali: `\frac`, `\sqrt`, `\lim`, `\sum`, `\prod`, `\int`, `\log`, `\ln`, `\sin`, `\cos`, `\tan`, `\text`, `\boxed`, `\cdot`, `\quad`, `\to`.

Se l'AI scrive `la derivata è \frac{d}{dx}x^2 = 2x` fuori da delimitatori, `healLaTeX` **non lo salva** e KaTeX mostra il testo raw.

### 3. La regex `/{[\s\S]*}/` per il JSON match è troppo greedy

[route.ts:61](file:///Users/alessandrogiampietro/studiai/src/lib/utils.ts#L61):
```javascript
const jsonMatch = text.match(/\{[\s\S]*\}/)
```

Questa è una regex **greedy** che matcha dalla **prima** `{` all'**ultima** `}` nel testo. Se l'AI produce:
```
Ecco la risposta: {"passi": [...]} Spero sia utile! {"nota": "extra"}
```

La regex cattura `{"passi": [...]} Spero sia utile! {"nota": "extra"}`, che non è JSON valido. **Fallback al legacy parser**.

Il test a riga 234-239 ne è consapevole ma il risultato è silenziosamente sbagliato (restituisce 0 passi).

### 4. Il parsing streaming parziale non gestisce le stringhe JSON con `\"` correttamente in tutti i casi

In [utils.ts:101](file:///Users/alessandrogiampietro/studiai/src/lib/utils.ts#L101) e simili:
```javascript
text.match(/"titolo"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/)
```

Questa regex è corretta per stringhe JSON standard, **ma fallisce** quando il JSON ha escaped unicode (`\u00e0`) o escaped forward slash (`\/`). Non è critico perché l'AI raramente produce queste escape, ma è un'area fragile.

---

## 🟠 Problemi di robustezza LaTeX

### 5. `\[...\]` e `\(...\)` sono preservati ma NON convertiti dal parser

Il prompt dice esplicitamente "NON usare `\[ \]`, `\( \)` o `\begin{equation}`". C'è anche `fixLatexInValue` in [route.ts:199-214](file:///Users/alessandrogiampietro/studiai/src/app/api/explain/route.ts#L199-L214) che fa la conversione... **ma non viene mai chiamata!**

```typescript
function fixLatexInValue(value: unknown): unknown { ... }
```

Questa funzione è **dead code**. Se l'AI ignora le istruzioni e usa `\[...\]`, queste arrivano intatte al client. I test lo confermano ([utils.test.ts:54-63](file:///Users/alessandrogiampietro/studiai/src/__tests__/utils.test.ts#L54-L63)):
```
// "should still be preserved as-is" ← questo è il problema!
```

> [!CAUTION]
> `fixLatexInValue` non è mai chiamata. I delimitatori `\[...\]` e `\(...\)` arrivano al renderer senza conversione. KaTeX di default **non supporta** questi delimitatori via remark-math, quindi le formule non renderizzano.

### 6. `healLaTeX` non normalizza `\[...\]` e `\(...\)` a `$$..$$` e `$...$`

`healLaTeX` corregge backslash mancanti, infinity, e arrow symbols... ma ignora completamente la conversione dei delimitatori LaTeX alternativi. Dovrebbe fare:
```
\[ ... \]  →  $$ ... $$
\( ... \)  →  $ ... $
```

### 7. Il prompt non specifica come gestire i casi con matrici, determinanti, sistemi

`\begin{pmatrix}`, `\begin{vmatrix}`, `\begin{bmatrix}` non sono nella lista di `healLaTeX` che normalizza i backslash mancanti. Unica lista: `aligned|cases|matrix|pmatrix|array|equation`.

**Mancano**: `vmatrix`, `bmatrix`, `Bmatrix`, `Vmatrix`, `gather`, `split`.

### 8. `healLaTeX` non gestisce `\\text{}` o `\\mathrm{}` fuori contesto math

L'AI a volte scrive `\text{Dom}(f) = ...` fuori dai delimitatori. `healLaTeX` non lo cattura.

---

## 🟡 UX e leggibilità per lo studente

### 9. `ExplanationRenderer` non mostra un sommario / indice dei passi

Lo studente è costretto a navigare linearmente passo dopo passo. Non c'è:
- Una barra laterale con i titoli dei passi
- Un indice cliccabile in cima
- La possibilità di "tornare" a un passo precedente senza scrollare

Per esercizi con 6-8 passi, è un problema reale.

### 10. I passi sono **dimmed** quando non focused (opacity 0.4)

[ExplanationRenderer.tsx:74](file:///Users/alessandrogiampietro/studiai/src/components/exercise/ExplanationRenderer.tsx#L74):
```jsx
opacity: isDimmed ? 0.4 : 1,
```

Questo significa che lo studente vede **un solo passo leggibile per volta**. Per chi vuole rileggere l'intera soluzione come un testo continuo, è frustrante. Opacity 0.4 è troppo bassa — il testo è quasi illeggibile.

> [!WARNING]
> L'esperienza è quella di un "tunnel" dove ogni passo scompare. Per uno studente che studia, questo è controproducente. Meglio rendere tutti i passi leggibili (opacity 0.7-0.8 minimum) e usare un highlight sottile per il passo attivo.

### 11. La soluzione finale è nascosta dietro un click ("Rivela Soluzione")

[ExplanationRenderer.tsx:134-141](file:///Users/alessandrogiampietro/studiai/src/components/exercise/ExplanationRenderer.tsx#L134-L141): Lo studente deve navigare **tutti** i passi, arrivare all'ultimo, poi cliccare "Rivela Soluzione". Se vuole solo la risposta veloce, non c'è modo.

**Suggerimento**: Mostrare la soluzione finale come card **sempre visibile** (collapsed) in basso, con un toggle per espanderla. In questo modo chi vuole capire il ragionamento legge i passi, chi vuole solo la risposta la trova subito.

### 12. I passi non hanno numerazione visiva coerente

Il titolo del passo mostra `PASSO {i+1}` in un badge, ma il titolo effettivo del passo non è separato visivamente. Il badge + il titolo + il corpo finiscono tutti nella stessa area visiva senza gerarchia chiara.

### 13. Nessun indicatore di progresso

Lo studente non sa quanti passi mancano. Un semplice "Passo 3 di 6" o una progress bar darebbe contesto.

---

## 🟢 Miglioramenti secondari (qualità)

### 14. `parseExplanation` durante lo streaming viene chiamata ad ogni chunk

[useStore.ts:416](file:///Users/alessandrogiampietro/studiai/src/store/useStore.ts#L416):
```javascript
const parsed = parseExplanation(accumulatedText, true)
```

E nel renderer, [ExplanationRenderer.tsx:25](file:///Users/alessandrogiampietro/studiai/src/components/exercise/ExplanationRenderer.tsx#L25):
```javascript
const parsed = useMemo(() => parseExplanation(text, true), [text])
```

Il `useMemo` ricalcola ad ogni cambio di `text` (ogni chunk streaming). Il parser fa regex matching, JSON parsing, e `healLaTeX` su tutto il testo accumulato, ripetutamente. Per risposte lunghe questo è **O(n²)**.

### 15. Il `<MD>` component non ha `throwOnError: false` per KaTeX

```jsx
const MD = ({ children }: { children: string }) => (
  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
    {children}
  </ReactMarkdown>
)
```

Se KaTeX incontra un comando sconosciuto, **crasherà** l'intero blocco. Bisogna passare le opzioni:
```jsx
rehypePlugins={[[rehypeKatex, { throwOnError: false, errorColor: '#cc0000' }]]}
```

> [!IMPORTANT]
> Senza `throwOnError: false`, un singolo errore LaTeX può rendere l'intero passo illeggibile (mostra errore rosso o niente).

### 16. `cleanEscapes` nel parser streaming non è completa

[utils.ts:91-97](file:///Users/alessandrogiampietro/studiai/src/lib/utils.ts#L91-L97):
```javascript
const cleanEscapes = (str: string) => {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
}
```

L'ordine è sbagliato: `\\\\` dovrebbe essere processato **prima** di `\\n`, altrimenti `\\\\n` (backslash letterale + n) diventa `\` + newline invece che `\\n`. In pratica l'AI raramente produce `\\\\n`, ma è un bug latente.

---

## 📊 Riassunto priorità

| # | Gravità | Problema | Impatto studente |
|---|---------|----------|-----------------|
| 5-6 | 🔴 | `\[...\]` e `\(...\)` non convertiti | Formula non renderizzata |
| 15 | 🔴 | KaTeX senza `throwOnError: false` | Crash intero blocco |
| 2 | 🟠 | `\frac`, `\lim` ecc non wrappati da healLaTeX | Formula raw nel testo |
| 3 | 🟠 | Regex greedy per JSON match | Parsing silenziosamente fallito |
| 10 | 🟡 | Passi dimmed a 0.4 | Difficile rileggere |
| 11 | 🟡 | Soluzione nascosta dietro click | Frustrazione utente |
| 13 | 🟡 | Nessun indicatore di progresso | Disorientamento |
| 1 | 🟡 | Simboli wrappati singolarmente | Spaziatura brutta |
| 16 | 🟢 | cleanEscapes ordine sbagliato | Bug raro |
| 14 | 🟢 | Re-parse O(n²) durante streaming | Performance |

---

## Vuoi che implementi le fix? Se sì, su quali categorie mi concentro?

Le opzioni principali sono:
1. **Fix critiche LaTeX** (#5, #6, #15, #2) — rendere le formule molto più robuste
2. **Fix UX studente** (#10, #11, #13) — migliorare la leggibilità e navigazione
3. **Fix parsing** (#3, #16) — rendere il parser più resiliente
4. **Tutte** — piano completo di refactoring
