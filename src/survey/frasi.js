// Frasi di lettura del risultato: una per dimensione (d1...d7) e per fascia (1-5).
// Segnaposto in attesa dei testi definitivi (SURVEY_SPEC.md, sezione 9):
// sostituire ogni stringa mantenendo la struttura { dN: { 1: '...', ..., 5: '...' } }.

const FRASI = {
  d1: {
    1: '[[FRASE d1 fascia 1]]',
    2: '[[FRASE d1 fascia 2]]',
    3: '[[FRASE d1 fascia 3]]',
    4: '[[FRASE d1 fascia 4]]',
    5: '[[FRASE d1 fascia 5]]',
  },
  d2: {
    1: '[[FRASE d2 fascia 1]]',
    2: '[[FRASE d2 fascia 2]]',
    3: '[[FRASE d2 fascia 3]]',
    4: '[[FRASE d2 fascia 4]]',
    5: '[[FRASE d2 fascia 5]]',
  },
  d3: {
    1: '[[FRASE d3 fascia 1]]',
    2: '[[FRASE d3 fascia 2]]',
    3: '[[FRASE d3 fascia 3]]',
    4: '[[FRASE d3 fascia 4]]',
    5: '[[FRASE d3 fascia 5]]',
  },
  d4: {
    1: '[[FRASE d4 fascia 1]]',
    2: '[[FRASE d4 fascia 2]]',
    3: '[[FRASE d4 fascia 3]]',
    4: '[[FRASE d4 fascia 4]]',
    5: '[[FRASE d4 fascia 5]]',
  },
  d5: {
    1: '[[FRASE d5 fascia 1]]',
    2: '[[FRASE d5 fascia 2]]',
    3: '[[FRASE d5 fascia 3]]',
    4: '[[FRASE d5 fascia 4]]',
    5: '[[FRASE d5 fascia 5]]',
  },
  d6: {
    1: '[[FRASE d6 fascia 1]]',
    2: '[[FRASE d6 fascia 2]]',
    3: '[[FRASE d6 fascia 3]]',
    4: '[[FRASE d6 fascia 4]]',
    5: '[[FRASE d6 fascia 5]]',
  },
  d7: {
    1: '[[FRASE d7 fascia 1]]',
    2: '[[FRASE d7 fascia 2]]',
    3: '[[FRASE d7 fascia 3]]',
    4: '[[FRASE d7 fascia 4]]',
    5: '[[FRASE d7 fascia 5]]',
  },
}

export default FRASI

// Frase per dimensione e fascia; stringa vuota se manca (non blocca il risultato).
export function frase(idDimensione, fascia) {
  return FRASI[idDimensione]?.[fascia] ?? ''
}
