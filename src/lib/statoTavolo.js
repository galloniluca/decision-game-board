// Stato di invio di un tavolo per un round, derivato dal documento in `scelte`.
// opzione = scelta confermata (scritta solo con "Invia scelta")
// opzione_bozza = scelta selezionata in quel momento (scritta ad ogni click, anche prima di inviare)
export function statoInvioTavolo(scelta) {
  if (!scelta) return 'vuoto'
  const bozza = scelta.opzione_bozza ?? scelta.opzione
  if (!bozza) return 'vuoto'
  if (scelta.opzione && bozza === scelta.opzione) return 'inviato'
  return 'in_corso'
}
