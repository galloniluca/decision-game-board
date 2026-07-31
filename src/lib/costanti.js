export const ROUNDS = [1, 2, 3, 4]
export const LETTERE = ['A', 'B', 'C']
export const SHIFT_VALORI = [-1, 0, 1]
export const NUM_TAVOLI = 6

export function idOpzione(round, opzione) {
  return `${round}${opzione}`
}

export function idScelta(tavoloId, round) {
  return `${tavoloId}_${round}`
}
