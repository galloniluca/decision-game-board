// Matrice punteggi di esempio, popolabile da /config con un click e poi modificabile riga per riga.
// Filo narrativo: un'azienda affronta 4 decisioni operative, ogni opzione migliora alcuni KPI
// e ne peggiora altri — nessuna opzione domina le altre, per mantenere il trade-off reale.
export const MATRICE_ESEMPIO = {
  1: {
    A: {
      nome: 'Automazione spinta della linea',
      shift_q: 1,
      shift_s: 0,
      shift_c: -1,
      shift_p: -1,
    },
    B: {
      nome: 'Formazione e riqualificazione del personale',
      shift_q: 1,
      shift_s: 1,
      shift_c: -1,
      shift_p: 1,
    },
    C: {
      nome: 'Mantenere il processo attuale',
      shift_q: 0,
      shift_s: 0,
      shift_c: 0,
      shift_p: 0,
    },
  },
  2: {
    A: {
      nome: 'Assumere personale a tempo determinato',
      shift_q: 0,
      shift_s: 1,
      shift_c: -1,
      shift_p: 0,
    },
    B: {
      nome: 'Richiedere straordinari al personale esistente',
      shift_q: -1,
      shift_s: 1,
      shift_c: 0,
      shift_p: -1,
    },
    C: {
      nome: 'Esternalizzare parte della produzione',
      shift_q: -1,
      shift_s: 0,
      shift_c: 1,
      shift_p: 0,
    },
  },
  3: {
    A: {
      nome: 'Dare priorità assoluta, rinviando altri ordini',
      shift_q: 0,
      shift_s: 1,
      shift_c: -1,
      shift_p: -1,
    },
    B: {
      nome: 'Negoziare una consegna posticipata col cliente',
      shift_q: 1,
      shift_s: -1,
      shift_c: 1,
      shift_p: 0,
    },
    C: {
      nome: 'Attivare un fornitore esterno di emergenza',
      shift_q: -1,
      shift_s: 1,
      shift_c: -1,
      shift_p: 0,
    },
  },
  4: {
    A: {
      nome: 'Investire in nuove tecnologie',
      shift_q: 1,
      shift_s: 0,
      shift_c: -1,
      shift_p: 0,
    },
    B: {
      nome: 'Ridurre i costi operativi',
      shift_q: -1,
      shift_s: -1,
      shift_c: 1,
      shift_p: -1,
    },
    C: {
      nome: 'Rafforzare il team con nuove assunzioni',
      shift_q: 1,
      shift_s: 1,
      shift_c: -1,
      shift_p: 1,
    },
  },
}
