# Stato del Progetto: theLemma 🚀

> [!IMPORTANT]
> **REGOLA MANDATORIA**: Da questo momento in poi (5 Maggio 2026), ogni modifica apportata al progetto DEVE essere documentata in questo file specificando la **DATA** dell'intervento nella sezione "Log delle Modifiche".

Questo documento riassume lo stato attuale dell'architettura e dell'interfaccia utente (UI/UX) del progetto theLemma.

## Log delle Modifiche (Storico)

### 5 Maggio 2026 - Potenziamento Tutor AI, UX Chat e Toast System
- **AI Tutor Hero Experience**:
    - **Welcome Proattivo**: Il tutor invia un messaggio di benvenuto automatico non appena la spiegazione è pronta.
    - **Tutor Profile UI**: Card profilo dedicata nella chat ("Online ora") per dare un'identità forte al tutor.
    - **Floating Assistant Button (FAB)**: Pulsante fluttuante espandibile ("Chiedi al Tutor") per saltare alla chat con transizioni fluide.
- **Unified Action Dock**:
    - **Floating Dock**: Redesign radicale della barra inferiore in un'isola flottante glassmorphic.
    - **Hero Buttons**: "Nuovo Esercizio" e "Condividi" ora hanno uno stile premium con micro-animazioni e shadow profonde.
- **Global Dynamic Island Toast System**:
    - **Centralizzazione**: Creato `ToastProvider` globale per gestire le notifiche in modo coerente in tutta l'app.
    - **UI Dynamic Island**: Toast posizionati in alto al centro, a forma di pillola, con glassmorphism e animazioni spring.
    - **Feedback Cromatico**: Colori specifici per azione (Oro per preferiti, Blu per link, Verde per successo) con icone contestuali.
- **Onboarding & Personalizzazione Premium**:
    - **Nuovo Flusso Onboarding**: Introdotte 5 slide immersive che presentano theLemma, le spiegazioni passo-passo, il Tutor AI e i grafici interattivi.
    - **Design Visivo**: Implementati sfondi animati, glassmorphism e tipografia premium (Outfit) per un'esperienza "Apple-like".
    - **Personalizzazione Avanzata**: Redesign della schermata di raccolta dati (nome, scuola, classe) con feedback visivi migliorati e micro-interazioni.
- **Undo Toast per Immagini**: Aggiunta funzionalità di "Annulla" (4 secondi) dopo l'eliminazione di un'immagine caricata, con thumbnail di anteprima e progress bar.
- **Raffinatezza Estetica e Funzionale**:
    - **Layout Compatto & Giustificato**: Ottimizzata la leggibilità con testo giustificato, sillabazione e spaziature ridotte.
    - **Auto-Expanding Input**: Chat textarea che si espande dinamicamente con il testo.
- **Architettura & Pulizia**:
    - **Type Centralization**: Iniziata la migrazione dei tipi core (es. `Toast`) in `@/types` per una migliore manutenibilità.
    - **Bug Fix**: Risolto bug duplicazione messaggi e corretto layout di scrolling `h-screen`.
- **Onboarding & Personalizzazione Premium**:
    - **Nuovo Flusso Onboarding**: Introdotte 5 slide immersive che presentano theLemma, le spiegazioni passo-passo, il Tutor AI e i grafici interattivi.
    - **Design Visivo**: Implementati sfondi animati, glassmorphism e tipografia premium (Outfit) per un'esperienza "Apple-like".
    - **Personalizzazione Avanzata**: Redesign della schermata di raccolta dati (nome, scuola, classe) con feedback visivi migliorati e micro-interazioni.
- **Undo Toast per Immagini**: Aggiunta funzionalità di "Annulla" (4 secondi) dopo l'eliminazione di un'immagine caricata, con thumbnail di anteprima e progress bar.
- **Bug Fix & Stabilità**:
    - Risolto bug della duplicazione dei messaggi utente nella cronologia chat.

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

- [ ] **Allenati con il Prof (Simulazione Interrogazione)**: Simulatore di esame orale con feedback in tempo reale.
- [ ] **Domanda di Controllo (Mini-Quiz)**: Verifica della comprensione a fine spiegazione.
- [ ] **Modalità "ELI5"**: Toggle per spiegazioni ultra-semplici o accademiche.
- [ ] **Esportazione PDF**: Generazione di file PDF completi di grafici per la stampa.
- [ ] **Miglioramento TypeScript**: Rimozione degli ultimi tipi `any` a favore di interfacce rigorose.
