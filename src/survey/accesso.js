// Accesso riservato alla pagina /survey-risultati.
// È un utente Firebase Authentication (Email/Password) creato a mano dalla console:
// l'email è fissa (un identificativo, non una casella reale), la password è la "chiave"
// contenuta nel link riservato (…/survey-risultati#chiave=<password>) e non sta nel codice.
// Le regole Firestore permettono la lettura di survey_risposte solo a questo utente:
// se cambi l'email qui, cambiala anche in firestore.rules (lo controlla content.test.js).
export const EMAIL_RISULTATI = 'risultati-survey@example.com'
