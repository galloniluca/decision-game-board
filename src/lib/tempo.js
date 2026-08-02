export const DURATA_ROUND_MINUTI_DEFAULT = 5

export function secondiRimanenti(timerAvvio, durataSecondi) {
  if (!timerAvvio || !durataSecondi) return null
  const inizioMs = timerAvvio.toMillis ? timerAvvio.toMillis() : new Date(timerAvvio).getTime()
  const trascorsi = (Date.now() - inizioMs) / 1000
  return Math.max(0, Math.round(durataSecondi - trascorsi))
}

export function formattaMMSS(secondi) {
  const m = Math.floor(secondi / 60)
  const s = secondi % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formattaOrario(timestamp) {
  if (!timestamp) return null
  const ms = timestamp.toMillis ? timestamp.toMillis() : new Date(timestamp).getTime()
  return new Date(ms).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
