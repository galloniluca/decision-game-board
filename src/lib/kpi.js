import { idOpzione } from './costanti'

export const KPI_CHIAVI = ['Q', 'S', 'C', 'P']
const CAMPO_SHIFT = { Q: 'shift_q', S: 'shift_s', C: 'shift_c', P: 'shift_p' }

export function calcolaKpiTavolo(scelte, opzioniMap) {
  const totali = { Q: 0, S: 0, C: 0, P: 0 }
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

export const COLORE_SEMAFORO = { rosso: '#e5484d', giallo: '#f5d90a', verde: '#30a46c' }
