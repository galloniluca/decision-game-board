// Matrice punteggi ufficiale — Lean Trade-off Game.
// Caricabile da /config con un click, poi modificabile riga per riga come tutto il resto.
// 4 KPI: Qualità, Servizio, Costi, Persone. Baseline configurabile da /config
// (sessione.kpi_baseline, vedi KPI_BASE_DEFAULT in kpi.js).
export const ROUND_NOMI = {
  1: 'Cliente imprevedibile',
  2: 'Collo di bottiglia',
  3: 'Shock esterno',
  4: 'Pressione sui costi',
}

export const MATRICE_UFFICIALE = {
  1: {
    A: {
      nome: 'Standardizzazione',
      shift_q: 1,
      shift_s: -1,
      shift_c: 0,
      shift_p: 0,
    },
    B: {
      nome: 'Flessibilità',
      shift_q: -1,
      shift_s: 0,
      shift_c: 1,
      shift_p: 0,
    },
    C: {
      nome: 'Pianificazione avanzata',
      shift_q: 0,
      shift_s: 1,
      shift_c: -1,
      shift_p: 0,
    },
  },
  2: {
    A: {
      nome: 'Specializzazione',
      shift_q: 1,
      shift_s: 0,
      shift_c: -1,
      shift_p: 0,
    },
    B: {
      nome: 'Polivalenza',
      shift_q: 0,
      shift_s: -1,
      shift_c: 1,
      shift_p: 1,
    },
    C: {
      nome: 'Supporto esterno',
      shift_q: -1,
      shift_s: 1,
      shift_c: 0,
      shift_p: 0,
    },
  },
  3: {
    A: {
      nome: 'Ridurre scorte (lean puro)',
      shift_q: -1,
      shift_s: 0,
      shift_c: 1,
      shift_p: 1,
    },
    B: {
      nome: 'Aumentare buffer',
      shift_q: 0,
      shift_s: 1,
      shift_c: -1,
      shift_p: 0,
    },
    C: {
      nome: 'Diversificare fornitori',
      shift_q: 1,
      shift_s: -1,
      shift_c: 0,
      shift_p: -1,
    },
  },
  4: {
    A: {
      nome: 'Continuare ottimizzazione',
      shift_q: -1,
      shift_s: 1,
      shift_c: 1,
      shift_p: -1,
    },
    B: {
      nome: 'Ripensare il sistema',
      shift_q: 0,
      shift_s: 0,
      shift_c: -1,
      shift_p: 1,
    },
    C: {
      nome: 'Supporto esterno',
      shift_q: 1,
      shift_s: -1,
      shift_c: 0,
      shift_p: 0,
    },
  },
}
