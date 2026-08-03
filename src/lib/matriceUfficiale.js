// Matrice punteggi ufficiale — Lean Trade-off Game V1.7 (31 luglio 2026).
// Caricabile da /config con un click, poi modificabile riga per riga come tutto il resto.
// I KPI partono da 1,1,1,1 (vedi KPI_BASE in kpi.js) e sono cumulativi round su round.
export const ROUND_NOMI = {
  1: 'Cliente imprevedibile',
  2: 'Collo di bottiglia',
  3: 'Shock esterno',
  4: 'Pressione sui costi',
}

export const MATRICE_UFFICIALE = {
  1: {
    A: { nome: 'Standardizzazione', shift_q: 1, shift_s: -1, shift_c: -1, shift_p: 0 },
    B: { nome: 'Flessibilità', shift_q: -1, shift_s: 0, shift_c: 1, shift_p: 0 },
    C: { nome: 'Pianificazione', shift_q: 0, shift_s: 1, shift_c: -1, shift_p: -1 },
  },
  2: {
    A: { nome: 'Specializzazione', shift_q: 1, shift_s: -1, shift_c: -1, shift_p: 0 },
    B: { nome: 'Polivalenza', shift_q: 0, shift_s: -1, shift_c: 1, shift_p: 1 },
    C: { nome: 'Outsourcing', shift_q: -1, shift_s: 1, shift_c: -1, shift_p: -1 },
  },
  3: {
    A: { nome: 'JIT', shift_q: -1, shift_s: -1, shift_c: 1, shift_p: 1 },
    B: { nome: 'Buffer', shift_q: 0, shift_s: 1, shift_c: -1, shift_p: -1 },
    C: { nome: 'Diversificazione', shift_q: 1, shift_s: -1, shift_c: 0, shift_p: -1 },
  },
  4: {
    A: { nome: 'Kaizen', shift_q: -1, shift_s: 1, shift_c: 1, shift_p: -1 },
    B: { nome: 'VSM', shift_q: 0, shift_s: 0, shift_c: -1, shift_p: 1 },
    C: { nome: 'Marketing', shift_q: 1, shift_s: -1, shift_c: -1, shift_p: 0 },
  },
}
