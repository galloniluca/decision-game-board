import { idOpzione } from './costanti'

export const KPI_CHIAVI = ['Q', 'S', 'C', 'P']
const CAMPO_SHIFT = { Q: 'shift_q', S: 'shift_s', C: 'shift_c', P: 'shift_p' }

// Baseline configurabile da /config (sessione.kpi_baseline): 0 (si parte da giallo) o 1 (da verde).
export const KPI_BASE_DEFAULT = 0

export function calcolaKpiTavolo(scelte, opzioniMap, base = KPI_BASE_DEFAULT) {
  const totali = { Q: base, S: base, C: base, P: base }
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
