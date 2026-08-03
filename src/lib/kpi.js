import { idOpzione } from './costanti'

export const KPI_CHIAVI = ['Q', 'S', 'C', 'P']
const CAMPO_SHIFT = { Q: 'shift_q', S: 'shift_s', C: 'shift_c', P: 'shift_p' }

// Ogni KPI parte da 1 (non 0) a inizio partita, comune a tutti i tavoli.
const KPI_BASE = 1

export function calcolaKpiTavolo(scelte, opzioniMap) {
  const totali = { Q: KPI_BASE, S: KPI_BASE, C: KPI_BASE, P: KPI_BASE }
  for (const scelta of scelte) {
    const opzione = opzioniMap[idOpzione(scelta.round, scelta.opzione)]
    if (!opzione) continue
    for (const kpi of KPI_CHIAVI) {
      totali[kpi] += opzione[CAMPO_SHIFT[kpi]] ?? 0
    }
  }
  return totali
}

export function semaforo(valore) {
  if (valore <= -1) return 'rosso'
  if (valore === 0) return 'giallo'
  return 'verde'
}
