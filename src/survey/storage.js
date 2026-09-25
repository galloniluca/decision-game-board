import { CAMPAGNA } from './content'

// Stato del questionario in localStorage, per non perdere nulla con un ricaricamento.
// Ogni accesso è protetto: in navigazione privata o con storage bloccato il survey funziona
// comunque, solo senza ripresa dopo il ricaricamento.
const CHIAVE = `survey:${CAMPAGNA}`

export function leggiStato() {
  try {
    const raw = window.localStorage.getItem(CHIAVE)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function salvaStato(stato) {
  try {
    window.localStorage.setItem(CHIAVE, JSON.stringify(stato))
  } catch {
    // storage non disponibile: si prosegue senza persistenza
  }
}
