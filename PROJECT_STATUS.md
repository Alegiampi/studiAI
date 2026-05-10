# Stato del Progetto: theLemma 🚀

> [!IMPORTANT]
> **REGOLA MANDATORIA**: Da questo momento in poi (5 Maggio 2026), ogni modifica apportata al progetto DEVE essere documentata in questo file specificando la **DATA** dell'intervento nella sezione "Log delle Modifiche".

Questo documento riassume lo stato attuale dell'architettura e dell'interfaccia utente (UI/UX) del progetto theLemma.

## Log delle Modifiche (Storico)

### 11 Maggio 2026 - Stabilizzazione Grafica, AI Optimization & Bug Fix
- **Mafs 4.0 (Rendering Stability)**:
    - **Fix Iperboli (1/x)**: Risolto definitivamente il problema della "linea verticale" nelle discontinuità. Implementata una soglia dinamica (`|y| > 200`) che restituisce `NaN`, forzando Mafs a spezzare il percorso SVG invece di unire i rami.
    - **Fix Asintoti Invisibili**: Eliminati i conflitti tra `framer-motion` e il contesto SVG di Mafs che rendevano invisibili gli asintoti sugli assi. Rimosso il wrapper `<motion.g>` a favore di un montaggio/smontaggio condizionale diretto.
    - **Precisione Colori**: Gli asintoti ora sono sempre visibili e correttamente distinti cromaticamente (Arancione/Viola).
- **AI Model Optimization (Cost & Speed)**:
    - **Architettura Multi-Modello**:
        - **Heavy Duty (Llama 3.3 70B)**: Mantenuto per Spiegazioni Complesse, Chat Tutor e Generazione Grafica per garantire il massimo rigore matematico.
        - **Light Duty (Llama 3.1 8B)**: Introdotto per compiti meccanici come la **Classificazione degli esercizi** e i **Chiarimenti Rapidi**, riducendo il consumo di token del 90% e dimezzando i tempi di risposta.
- **Error Handling & UX**:
    - **Rate Limit awareness**: Migliorata la gestione degli errori API per distinguere tra fallimenti generici e limiti di token di Groq, informando l'utente con toast specifici ("Limite API raggiunto. Riprova tra poco").
    - **Auto-Fix Sintassi**: Risolti bug di rendering nel frontend causati da tag JSX non chiusi correttamente durante i ricaricamenti.

### 11 Maggio 2026 - UX Condivisione & Tutor AI Premium Area
- **Pagina di Condivisione (Share Page)**:
    - Ridisegnata completamente la pagina pubblica di condivisione (`s/[id]`) per riflettere l'estetica premium del progetto.
    - Implementato un layout "Gated Content": il grafico interattivo e l'anteprima della chat del Tutor vengono mostrati sfocati (`backdrop-blur`) per creare un forte *Curiosity Gap*.
    - Aggiunte CTA (Call to Action) strategiche ("Sblocca Chat Gratuita", "Sblocca Grafico") per massimizzare le conversioni degli utenti non registrati.
    - Integrazione dell'uso di `ExplanationRenderer` per uniformare l'esperienza di lettura passo-passo.
- **Tutor AI Area (Explanation Screen)**:
    - Redesign massiccio della sezione "Tutor Personale AI" all'interno della schermata delle spiegazioni per renderla più "ariosa" e professionalmente distinta.
    - Introdotto un **Separatore Elegante** con sfumature (`bg-gradient`) e un'etichetta centrale "AREA TUTOR" per dividere nettamente la zona di lettura passiva da quella di interazione attiva.
    - Implementato l'indicatore animato di "Tutor che scrive..." (3 puntini rimbalzanti) al posto del classico spinner, aumentando la percezione di star chattando con un assistente reale.
    - Rimosso lo sfondo invadente a favore di un layout pulito, con l'avatar del bot dotato di un sottile effetto glow (`blur-md` in background).

### 15 Maggio 2026 - Mafs Refactoring, AI Robustness & Fluid UI
- **Mafs 3.5 (Interactive Graph Evolution)**:
    - **Refactoring**: Decoupled `GraficoMafs.tsx` into `FunctionLayer.tsx` and `GraphSidebar.tsx` for improved modularity.
    - **AI Robustness**: 
        - Implemented fallback parsing for AI-generated mathematical strings (stripping text, enforcing number extraction).
        - Heuristic-based detection of vertical lines via labels.
        - Removed domain restrictions for asymptotes to ensure infinite rendering.
    - **Visual Fidelity**:
        - Fixed "straight line" artifacts at discontinuities by removing artificial value clamping.
        - Enhanced visibility of $x=0/y=0$ asymptotes using distinct colors (Orange/Purple).
        - Added smooth `framer-motion` animations for hiding/showing elements both in UI and on-graph.
- **AI Assist Pipeline**:
    - Optimized `api/graph/route.ts` prompt for better color choices and bounding box calculations.
    - Implemented a more reliable context sharing between the graph state and the AI assist API.

### 10 Maggio 2026 - Laboratorio Matematico Interattivo (Mafs 3.0)
- **Inserimento Funzioni Utente**: Trasformato il grafico in uno strumento attivo dove l'utente può aggiungere le proprie funzioni cliccando su "+ Aggiungi funzione".
- **Smart Notation & Sanitizzazione**: Implementato un pre-processore che corregge automaticamente le notazioni comuni (es. `sinx` -> `sin(x)`).
- **Supporto Funzioni Inverse ($x = f(y)$)**: Potenziato il rendering per supportare parabole orizzontali e relazioni dove la $x$ dipende dalla $y$ (es. `x = y^2`), con riconoscimento automatico della variabile e supporto agli spazi (es. `x = y^2`).
- **Heuristic Detection Rette Verticali**: Implementata una logica avanzata che riconosce se una funzione costante fornita dall'IA è una retta verticale analizzando la label (es. "Asse di simmetria x=30").
- **Ottimizzazione Zoom AI**: Affinate le istruzioni dell'IA per il `boundingBox` per evitare zoom out eccessivi causati da punti di intersezione lontani (es. y=900), mantenendo la vista centrata sugli elementi chiave.
- **Gestione Funzioni Personalizzate**: Aggiunta possibilità di **modificare** (pencil icon) ed **eliminare** (trash icon) le funzioni aggiunte dall'utente direttamente dalla sidebar.
- **Nuovo Layout Sidebar**: Riprogettata l'interfaccia del grafico con una colonna di controllo laterale professionale.
- **Personalizzazione Colori**: Integrazione Color Picker di sistema per ogni elemento del grafico.

### 7 Maggio 2026 - Potenziamento Grafici e Analisi Interattiva
- **Grafici 2.0 (Analisi Interattiva)**:
    - **Punto Tangente Dinamico**: Introdotto un punto mobile sulla funzione che calcola e visualizza istantaneamente la retta tangente e la pendenza ($m$) tramite `mathjs`. Ideale per spiegare il concetto di derivata.
    - **Stabilizzazione Rendering**: Risolti bug critici di sparizione dei grafici durante il panning tramite clipping Y intelligente (+/- 5000) e gestione dello stato `viewBox` via `key-reset` (compatibilità Mafs 0.21.0).
- **Rigore Matematico AI**:
    - Aggiornate le istruzioni dell'IA per prevenire allucinazioni su asintoti e limiti (es. rimosso asintoto errato per $x^x$).
    - Migliorata la precisione del "centramento" iniziale del grafico per mostrare sempre gli assi cartesiani e l'origine.
- **Fix Strutturali & Compatibilità**: Corretti errori di sintassi critici in `route.ts` e risolti conflitti di tipi in `GraficoMafs.tsx`.

### 6 Maggio 2026 (Notte) - Upgrade Intelligenza di Ragionamento
- **Pipeline Vision a 2 Stadi**: `llama-4-scout` estrae il testo dall'immagine (OCR), poi `openai/gpt-oss-120b` genera la spiegazione. Ora tutti e tre i path (immagine, testo, chat) usano lo stesso motore di ragionamento.
- **Helper `callGroq`**: Estratta una funzione riutilizzabile `callGroq()` per semplificare le chiamate API e centralizzare la gestione degli errori.

### 6 Maggio 2026 (Sera) - Raffinamento Ragionamento Matematico
- **Ottimizzazione Dominio Funzioni**:
    - **Analisi Reale Standard**: Forzata l'identità $f(x)^{g(x)} = e^{g(x) \ln f(x)}$ nel System Prompt per evitare analisi "pedagogiche" prolisse e fornire domini analiticamente corretti e immediati.
    - **Precisione Math**: Migliorata la gestione dei casi critici ($0^0$, basi negative) privilegiando la strada dell'analisi reale.

### 6 Maggio 2026 (Sera) - Espansione Gamification e Studio Proattivo
- **Nuove Direzioni di Progetto**:
    - **Modalità Giochi (Allenamento)**: Definizione dell'architettura per mini-giochi educativi (partendo dalle Tabelline) con tracking dei record personali.
    - **Generatore di Esercizi Smart**: Progettazione di un sistema AI che genera varianti di esercizi basandosi sulla cronologia o su input manuale (modalità: Riscaldamento, Consolidamento, Sfida).

### 5 Maggio 2026 (Sera) - Raffinamento Estetico Explanation Page
- **Formula Rendering Perfection**: 
    - **STATO**: Considerato **PERFETTO** e non richiede ulteriori modifiche.
- **UI Refinement**:
    - **Surgical Elegance**: Ridotto lo spessore dell'indicatore laterale degli step (da 1.5px a 2px) con un effetto luce più sottile.
    - **Compact Action Dock**: Rimpicciolita la barra dei comandi inferiore (height h-11, padding ridotti) per una presenza più discreta e meno ingombrante.
    - **Fluidità Transizioni**: Implementato l'uso del prop `layout` di Framer Motion per transizioni fluide tra i passaggi della spiegazione.

### 5 Maggio 2026 (Pomeriggio) - Potenziamento Tutor AI, UX Chat e Toast System
- **AI Tutor Hero Experience**: Welcome proattivo, Tutor Profile UI e Floating Assistant Button (FAB).
- **Unified Action Dock**: Redesign radicale della barra inferiore in un'isola flottante glassmorphic.
- **Global Dynamic Island Toast System**: Creato `ToastProvider` globale con stile pillola "Apple-like".
- **Onboarding & Personalizzazione Premium**: 5 slide immersive, sfondi animati e tipografia Outfit.
- **Undo Toast per Immagini**: Aggiunta funzionalità di "Annulla" (4 secondi) per l'eliminazione immagini.
- **Bug Fix & Stabilità**: Risolto bug duplicazione messaggi e corretto layout di scrolling.

---

## Cosa abbiamo fatto finora (Riepilogo Generale)

### 1. **Rebranding Completo: da StudiAI a theLemma**
- **Nuovo Nome**: Scelta di **theLemma**, richiamando il concetto matematico di "verità dimostrata".
- **Identità Visiva**: Logo testuale raffinato con contrasto tipografico e shimmer animation "Thinking".

### 2. **Design System Premium**
- **Tailwind v4 + Framer Motion**: Tema dark mode elegante (`#121212`), glassmorphism e animazioni fluide.
- **Tipografia**: Font premium **Outfit**.

### 3. **Image Editing & Cropping Avanzato** ✂️
- **Ritaglio Libero**: Selettore a angoli trascinabili per inquadrature flessibili.
- **Rotazione 90°**: Supporto integrato con ricalcolo coordinate.
- **Ottimizzazione API**: Ridimensionamento (1280px) e compressione JPEG (0.7) per risparmio banda e costi.

### 4. **Motore Grafico & Chat**
- **Mafs + mathjs**: Rendering di grafici interattivi SVG di alta qualità.
- **Chat Context-Aware**: Il tutor conosce l'esercizio e la spiegazione corrente.

---

## Architettura Tecnologica

- **Frontend**: Next.js (App Router), Tailwind CSS, Framer Motion.
- **Backend**: Supabase (Auth, DB), Groq (Llama 3.3 70B) per Spiegazioni e Chat.
- **Utility**: Mafs (Grafici), Mathjs (Calcoli), React-Markdown (Rendering).

## Prossimi Passi

- [ ] **Modalità Giochi (Tabelline & Progressi)**: Mini-giochi interattivi per l'allenamento rapido.
    - *Tabelline Speed-Run*: Record di tempo su 20 domande.
    - *Il Duello delle Equazioni*: Risoluzione rapida di equazioni semplici.
    - *Caccia all'Errore*: Identificazione di errori comuni in passaggi matematici.
    - *Formula Master*: Matching tra nomi di leggi e formule.
    - *Vero o Falso Scientifico*: Quiz rapidi di cultura generale/scienze.
- [ ] **Generatore di Esercizi Smart**: Creazione di varianti (più facili/difficili) partendo dallo storico.
- [ ] **Allenati con il Prof (Simulazione Interrogazione)**: Simulatore di esame orale con feedback in tempo reale.
- [ ] **Domanda di Controllo (Mini-Quiz)**: Verifica della comprensione a fine spiegazione.
- [ ] **Esportazione PDF**: Generazione di file PDF completi di grafici per la stampa.
- [ ] **Miglioramento TypeScript**: Rimozione degli ultimi tipi `any` a favore di interfacce rigorose.
