import { CAMPI_ANAGRAFICA, CONSENSI, MAX_LUNGHEZZA_TESTO } from './content'

// Stessi controlli delle regole Firestore su survey_risposte, per dare errori chiari
// all'utente invece di un rifiuto del server.
const EMAIL_VALIDA = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function erroriAnagrafica(valori) {
  const errori = {}
  for (const campo of CAMPI_ANAGRAFICA) {
    const v = String(valori?.[campo.id] ?? '').trim()
    if (!v) errori[campo.id] = 'Campo obbligatorio'
    else if (campo.tipo === 'select' && !campo.opzioni.includes(v)) errori[campo.id] = 'Scegli un valore'
    else if (v.length > MAX_LUNGHEZZA_TESTO) errori[campo.id] = 'Testo troppo lungo'
    else if (campo.tipo === 'email' && !EMAIL_VALIDA.test(v)) errori[campo.id] = 'Email non valida'
  }
  return errori
}

export function anagraficaValida(valori) {
  return Object.keys(erroriAnagrafica(valori)).length === 0
}

export function consensiValidi(valori) {
  return CONSENSI.every((c) => !c.obbligatorio || valori?.[c.id] === true)
}
