import { useEffect, useState } from 'react'
import { formattaMMSS, secondiRimanenti } from '../lib/tempo'

function Timer({ timerAvvio, durataSecondi, large }) {
  const [rimanenti, setRimanenti] = useState(() => secondiRimanenti(timerAvvio, durataSecondi))

  useEffect(() => {
    setRimanenti(secondiRimanenti(timerAvvio, durataSecondi))
    const interval = setInterval(() => {
      setRimanenti(secondiRimanenti(timerAvvio, durataSecondi))
    }, 1000)
    return () => clearInterval(interval)
  }, [timerAvvio, durataSecondi])

  if (rimanenti === null) return null

  const scaduto = rimanenti <= 0
  const classi = ['timer', large && 'timer-xl', scaduto && 'expired'].filter(Boolean).join(' ')

  return <p className={classi}>{scaduto ? 'Tempo scaduto' : formattaMMSS(rimanenti)}</p>
}

export default Timer
