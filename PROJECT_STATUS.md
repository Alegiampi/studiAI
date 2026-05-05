# Stato del Progetto: theLemma 🚀

> [!IMPORTANT]
> **REGOLA MANDATORIA**: Da questo momento in poi (5 Maggio 2026), ogni modifica apportata al progetto DEVE essere documentata in questo file specificando la **DATA** dell'intervento nella sezione "Log delle Modifiche".

Questo documento riassume lo stato attuale dell'architettura e dell'interfaccia utente (UI/UX) del progetto theLemma.

## Log delle Modifiche (Storico)

### 5 Maggio 2026 - Potenziamento Tutor AI & UX Chat
- **AI Tutor Hero Experience**:
    - **Welcome Proattivo**: Il tutor ora invia un messaggio di benvenuto automatico non appena la spiegazione è pronta.
    - **Tutor Profile UI**: Aggiunta una card profilo dedicata nella chat ("Online ora") per dare un'identità forte al tutor.
    - **Floating Assistant Button (FAB)**: Implementato un pulsante fluttuante (robottino giallo) che si espande dinamicamente ("Chiedi al Tutor") per saltare alla chat da qualsiasi punto della spiegazione.
- **Unificazione dell'Esperienza**:
    - Collegati i pulsanti **"Dubbi?"** dei singoli passaggi direttamente alla chat principale, pre-compilando il contesto per una conversazione fluida.
- **Raffinatezza Estetica e Funzionale**:
    - **Layout Compatto**: Ottimizzati i margini e gli spazi verticali per migliorare la leggibilità delle spiegazioni lunghe.
    - **Testo Giustificato**: Implementata la giustificazione del testo con sillabazione automatica per un look editoriale professionale.
    - **Auto-Expanding Input**: L'area di inserimento testo della chat ora si espande dinamicamente in base alla lunghezza della domanda.
- **Bug Fix & Stabilità**:
    - Risolto bug della duplicazione dei messaggi utente nella cronologia chat.
    - Corretto il layout di scrolling (da body a interno `h-screen`) per garantire la visibilità costante di header, footer e FAB.

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

- [ ] **Domanda di Controllo (Mini-Quiz)**: Verifica della comprensione a fine spiegazione.
- [ ] **Modalità "ELI5"**: Toggle per spiegazioni ultra-semplici o accademiche.
- [ ] **Esportazione PDF**: Generazione di file PDF completi di grafici per la stampa.
- [ ] **Miglioramento TypeScript**: Rimozione degli ultimi tipi `any` a favore di interfacce rigorose.
