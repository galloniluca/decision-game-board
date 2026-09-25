// Calcolo dei punteggi del questionario (SURVEY_SPEC.md, sezione 4).
// Modulo puro, senza dipendenze da React o Firebase: lo usano sia l'app sia i test.

export const ID_DIMENSIONI = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7']
export const DOMANDE_PER_DIMENSIONE = 3

export const LIVELLI = [
  { fascia: 1, nome: 'Iniziale', max: 20 },
  { fascia: 2, nome: 'Emergente', max: 40 },
  { fascia: 3, nome: 'Strutturato', max: 60 },
  { fascia: 4, nome: 'Consolidato', max: 80 },
  { fascia: 5, nome: 'Eccellente', max: 100 },
]

export function idDomandeDimensione(idDimensione) {
  return Array.from({ length: DOMANDE_PER_DIMENSIONE }, (_, i) => `${idDimensione}q${i + 1}`)
}

export function tuttiIdDomande() {
  return ID_DIMENSIONI.flatMap(idDomandeDimensione)
}

export function rispostaValida(valore) {
  return Number.isInteger(valore) && valore >= 1 && valore <= 5
}

// true se tutte le 21 domande hanno una risposta intera 1-5.
export function risposteComplete(risposte) {
  return tuttiIdDomande().every((id) => rispostaValida(risposte?.[id]))
}

// Percentuale non arrotondata di una dimensione: media 1 → 0, media 5 → 100.
export function punteggioDimensione(risposte, idDimensione) {
  const valori = idDomandeDimensione(idDimensione).map((id) => risposte[id])
  if (!valori.every(rispostaValida)) {
    throw new Error(`Risposte incomplete o non valide per ${idDimensione}`)
  }
  const media = valori.reduce((a, b) => a + b, 0) / valori.length
  return ((media - 1) / 4) * 100
}

// { d1..d7, totale }: valori non arrotondati; il totale è la media delle 7 dimensioni.
export function calcolaPunteggi(risposte) {
  const punteggi = {}
  for (const id of ID_DIMENSIONI) punteggi[id] = punteggioDimensione(risposte, id)
  punteggi.totale = ID_DIMENSIONI.reduce((s, id) => s + punteggi[id], 0) / ID_DIMENSIONI.length
  return punteggi
}

// Valore mostrato a video (intero).
export function arrotonda(pct) {
  return Math.round(pct)
}

// Livello di maturità calcolato sul valore arrotondato (0-20, 21-40, ...).
export function livello(pct) {
  const r = arrotonda(pct)
  return LIVELLI.find((l) => r <= l.max) ?? LIVELLI[LIVELLI.length - 1]
}

// Punti di forza: le 2 dimensioni più alte; aree di attenzione: le 2 più basse tra le restanti.
// A parità di punteggio (valore non arrotondato) vince l'ordine d1...d7 in entrambe le liste.
// Le attenzioni si scelgono escludendo le forze, così le due liste non si sovrappongono
// nemmeno quando molte dimensioni sono a pari merito.
export function forzeEAttenzioni(punteggi, quante = 2) {
  const indice = (id) => ID_DIMENSIONI.indexOf(id)
  const forze = [...ID_DIMENSIONI]
    .sort((a, b) => punteggi[b] - punteggi[a] || indice(a) - indice(b))
    .slice(0, quante)
  const attenzioni = ID_DIMENSIONI.filter((id) => !forze.includes(id))
    .sort((a, b) => punteggi[a] - punteggi[b] || indice(a) - indice(b))
    .slice(0, quante)
  return { forze, attenzioni }
}
