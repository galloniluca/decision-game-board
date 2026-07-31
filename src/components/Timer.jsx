import { useEffect, useState } from 'react'
import { formattaMMSS, secondiRimanenti } from '../lib/tempo'

function Timer({ timerAvvio }) {
  const [rimanenti, setRimanenti] = useState(() => secondiRimanenti(timerAvvio))

  useEffect(() => {
    setRimanenti(secondiRimanenti(timerAvvio))
    const interval = setInterval(() => {
      setRimanenti(secondiRimanenti(timerAvvio))
    }, 1000)
    return () => clearInterval(interval)
  }, [timerAvvio])

  if (rimanenti === null) return null

  const scaduto = rimanenti <= 0

  return (
    <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: scaduto ? 'crimson' : 'inherit' }}>
      {scaduto ? 'Tempo scaduto' : formattaMMSS(rimanenti)}
    </p>
  )
}

export default Timer
