import { collection, doc, getDocs, setDoc, writeBatch } from 'firebase/firestore'
import { db } from './firebaseClient'

export async function eseguiResetPartita() {
  const scelteSnap = await getDocs(collection(db, 'scelte'))
  const batch = writeBatch(db)
  scelteSnap.forEach((d) => batch.delete(d.ref))
  await batch.commit()

  await setDoc(doc(db, 'sessione', 'corrente'), {
    round_attivo: 1,
    stato: 'chiuso',
    timer_avvio: null,
  })
}
