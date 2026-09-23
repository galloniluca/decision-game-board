# Survey evento — Specifica funzionale e tecnica

Questionario online "Lean nell'era dell'incertezza" da inserire nell'app esistente (decision-game-board).
Evento: 29 settembre 2026, Campus Nuova Simonelli, Belforte del Chienti. Circa 50 partecipanti.
Lingua: italiano. Uso primario: smartphone, aperto da QR code.

Stato: struttura, domande e logica del risultato approvate. Le frasi di lettura (`frasi.js`) e il testo di informativa privacy sono da fornire (vedi sezione 9).

---

## 1. Obiettivo

Ogni partecipante scansiona un QR, compila il questionario (circa 10-12 minuti), vede subito il proprio risultato personale. Dopo la chiusura della raccolta (48 ore dopo la fine dell'evento) il benchmark viene calcolato fuori dall'app, con uno script, e consegnato a mano via email in PDF. L'app NON invia email e NON mostra il benchmark.

## 2. Flusso utente (route pubblica `/survey`)

1. **Benvenuto e consenso**: breve introduzione, informativa privacy, tre caselle di consenso (sezione 5).
2. **Anagrafica**: nome e cognome, azienda, email, ruolo (testo libero), settore (elenco chiuso), dimensione aziendale (elenco chiuso).
3. **7 schermate di domande**, una per dimensione, 3 domande per schermata. Barra di avanzamento "Dimensione X di 7". Non si avanza se le 3 domande non hanno risposta. Si può tornare indietro.
4. **Risultato personale** (sezione 4).

Requisiti UX:
- Mobile first; deve funzionare bene anche su desktop e tablet.
- Ogni domanda mostra 5 opzioni selezionabili (card o pulsanti a tutta larghezza) con il testo dell'ancora di ogni livello. Il numero 1-5 può essere mostrato come piccolo badge, ma il testo è quello che conta.
- Risposte e anagrafica salvate in `localStorage` a ogni passo, così un ricaricamento della pagina non fa perdere nulla.
- Dopo l'invio riuscito, salvare in `localStorage` che il questionario è completato: se il partecipante riapre `/survey` sullo stesso dispositivo, rivede il proprio risultato senza compilare di nuovo.
- Se la scrittura su Firestore fallisce (rete debole), mostrare un messaggio chiaro e un pulsante "Riprova", senza perdere le risposte.
- Nessun login. Riutilizzare il design system esistente (`src/index.css`), tema chiaro/scuro incluso.
- La pagina `/survey` non va linkata dalla Home né dalle altre viste del game.

## 3. Contenuto del questionario

Scala per ogni domanda: 5 livelli con ancore descrittive. Il partecipante sceglie il livello che descrive meglio la propria azienda oggi.

Trascrivere fedelmente in `src/survey/content.js` (id, testi e ancore esattamente come sotto).

### Dimensione 1 — Lean e flussi (`d1`)

**d1q1 — Mappatura dei flussi di valore**
1. I flussi non sono mappati.
2. Mappati in modo sporadico, solo in singoli progetti.
3. I flussi principali sono mappati (VSM) ma non vengono aggiornati.
4. Mappati e usati per scegliere le priorità di miglioramento.
5. Mappati, aggiornati con regolarità e usati per decisioni end-to-end, fornitori e clienti compresi.

**d1q2 — Standard di lavoro**
1. Ognuno lavora a modo proprio, senza standard.
2. Standard presenti solo in alcune aree e poco rispettati.
3. Standard formalizzati sulle attività chiave, con rispetto variabile.
4. Standard diffusi e verificati con audit periodici.
5. Standard vivi, aggiornati da chi li esegue e base del miglioramento continuo.

**d1q3 — Stabilità e regolarità del flusso**
1. Produzione a spinta, forti oscillazioni, gestione continua delle urgenze.
2. Alcuni tentativi di livellamento, senza continuità.
3. Logiche pull o livellamento attive in alcune aree.
4. Flusso regolare nella maggior parte dei processi, con lead time e WIP misurati.
5. Flusso tirato e livellato end-to-end, con lead time e WIP gestiti attivamente.

### Dimensione 2 — Miglioramento continuo e problem solving (`d2`)

**d2q1 — Metodo di problem solving**
1. I problemi si risolvono caso per caso, senza un metodo.
2. Il metodo esiste ma lo usano in pochi (es. 5 Why, A3) e solo per problemi gravi.
3. Metodo strutturato adottato nelle funzioni principali, con analisi delle cause radice non sempre sistematica.
4. Metodo diffuso e applicato con regolarità; le azioni correttive vengono verificate nella loro efficacia.
5. Metodo patrimonio comune a tutti i livelli; le cause radice vengono eliminate e la soluzione viene estesa ad altre aree.

**d2q2 — Sistema di miglioramento continuo (Kaizen)**
1. Non c'è un sistema; il miglioramento avviene solo in occasione di progetti o emergenze.
2. Iniziative Kaizen occasionali, promosse da singole persone.
3. Sistema strutturato (eventi Kaizen, gestione delle idee) attivo solo in alcune aree.
4. Sistema attivo e con calendario, con risultati misurati e condivisi.
5. Miglioramento continuo integrato nel lavoro quotidiano di tutti, con risultati collegati agli obiettivi aziendali.

**d2q3 — Gestione visiva e routine quotidiane**
1. Nessun momento strutturato di confronto sull'andamento del lavoro.
2. Riunioni o lavagne sporadiche, senza un formato definito.
3. Routine quotidiane (es. tier meeting, management visivo) presenti in alcune aree.
4. Routine diffuse, con indicatori aggiornati e azioni tracciate.
5. Routine consolidate su più livelli, con escalation dei problemi chiara e tempestiva.

### Dimensione 3 — Governance e strumenti decisionali (`d3`)

**d3q1 — KPI e cruscotti**
1. Non ci sono KPI condivisi; ogni funzione guarda i propri numeri.
2. KPI presenti ma diversi da funzione a funzione, con dati raccolti a mano e in ritardo.
3. Set di KPI definito, con fonti dati chiare, ma consultato in modo discontinuo.
4. Cruscotti aggiornati con regolarità e usati nelle riunioni per decidere.
5. KPI collegati agli obiettivi strategici, a cascata sui vari livelli, con soglie e azioni predefinite.

**d3q2 — Ruoli e responsabilità (RACI)**
1. Ruoli e responsabilità impliciti; spesso non è chiaro chi decide.
2. Definiti a livello di funzione, ma con sovrapposizioni e zone grigie nei processi trasversali.
3. Ruoli formalizzati per i processi principali (es. RACI), applicati in modo variabile.
4. Ruoli chiari e rispettati, con un responsabile (owner) per ogni processo chiave.
5. Ruoli riesaminati periodicamente e coerenti con la governance dei processi end-to-end.

**d3q3 — Pianificazione integrata (S&OP) e gate decisionali**
1. Ogni funzione pianifica per conto proprio; l'allineamento avviene solo in caso di emergenza.
2. Riunioni di allineamento saltuarie, senza un processo definito.
3. Processo di pianificazione periodico (es. S&OP mensile), ma con partecipazione e decisioni non sempre efficaci.
4. Processo consolidato, con dati condivisi, decisioni tracciate e verifica delle azioni.
5. Pianificazione integrata su più orizzonti, con gate decisionali formali su progetti e investimenti.

### Dimensione 4 — Decisioni e trade-off (`d4`)

**d4q1 — Consapevolezza dei trade-off**
1. I trade-off (costo, servizio, scorte, flessibilità, qualità) non vengono discussi apertamente.
2. Si riconoscono a parole, ma ognuno ottimizza il proprio obiettivo di funzione.
3. I trade-off principali sono identificati e discussi nelle riunioni chiave.
4. Trade-off esplicitati e valutati con dati, con effetti quantificati sulle funzioni coinvolte.
5. Trade-off gestiti in modo sistematico, con criteri di priorità condivisi e scelte trasparenti.

**d4q2 — Criteri e responsabilità della decisione**
1. Decide chi urla di più o chi è più vicino al problema, senza criteri.
2. Le decisioni le prende il vertice caso per caso, con criteri impliciti.
3. Criteri definiti solo per alcune decisioni ricorrenti (es. livelli di scorta, priorità ordini).
4. Criteri e livelli di autorità chiari per le principali decisioni, comunicati a tutti.
5. Decisioni delegate al livello giusto, con criteri condivisi e revisione periodica degli esiti.

**d4q3 — Gestione dell'incertezza**
1. Si reagisce agli imprevisti quando si presentano.
2. Si ha qualche margine (scorte di sicurezza, buffer) deciso a intuito.
3. Scenari e rischi principali considerati in alcune decisioni.
4. Scenari what-if usati regolarmente per le scelte su capacità, scorte e servizio.
5. Piani di risposta e simulazioni integrati nella pianificazione, con revisione degli scostamenti tra previsto e reale.

### Dimensione 5 — Digitalizzazione dei processi (`d5`)

**d5q1 — Qualità e disponibilità dei dati**
1. Dati sparsi su file e carta, spesso incoerenti.
2. Dati nei sistemi principali, ma con molte rielaborazioni manuali e più "versioni della verità".
3. Dati di base affidabili nei sistemi, con qualche integrazione tra le aree.
4. Dati affidabili e coerenti tra i sistemi, con responsabili definiti (data owner).
5. Dati affidabili in tempo reale e disponibili a tutti i livelli decisionali.

**d5q2 — Digitalizzazione dei processi transazionali**
1. Processi prevalentemente su carta, fogli di calcolo e email.
2. Alcuni processi supportati da gestionale, con molti passaggi manuali.
3. Processi principali (es. ordini, acquisti, produzione) su gestionale, con eccezioni gestite a mano.
4. Processi digitalizzati end-to-end nelle aree chiave, con automazioni e controlli.
5. Processi progettati in modo snello prima di digitalizzarli, con automazione diffusa e continuo miglioramento.

**d5q3 — Integrazione dei sistemi**
1. Sistemi separati, senza scambio automatico di dati.
2. Scambi dati manuali tra i sistemi (import/export).
3. Alcune integrazioni tra sistemi principali (es. ERP e produzione).
4. Integrazione estesa, con flussi automatici tra funzioni.
5. Architettura integrata anche con clienti e fornitori, scalabile e governata.

### Dimensione 6 — Intelligenza artificiale (`d6`)

**d6q1 — Utilizzo reale**
1. Non utilizziamo l'AI.
2. Uso individuale e non coordinato (es. strumenti generici usati dai singoli).
3. Alcuni casi d'uso in sperimentazione in singole funzioni.
4. Casi d'uso in produzione in diverse aree, con benefici misurati.
5. AI integrata nei processi principali e nelle decisioni, con risultati misurati e ripetibili.

**d6q2 — Governance e regole d'uso**
1. Nessuna regola sull'uso dell'AI.
2. Indicazioni informali su cosa è ammesso o vietato.
3. Politica aziendale definita (dati riservati, strumenti autorizzati), con applicazione non uniforme.
4. Politica applicata, con ruoli responsabili e controllo degli usi.
5. Governance completa: rischi, qualità dei risultati, tracciabilità e revisione periodica.

**d6q3 — Competenze e cultura**
1. Poche persone conoscono l'AI e il suo potenziale.
2. Interesse diffuso, senza formazione strutturata.
3. Formazione avviata su gruppi selezionati.
4. Competenze diffuse, con persone di riferimento (champion) nelle funzioni.
5. Cultura consolidata: le persone propongono e validano casi d'uso, sapendo quando fidarsi dell'output.

### Dimensione 7 — Persone e leadership (`d7`)

**d7q1 — Leadership Lean**
1. I capi gestiscono soprattutto le urgenze; non c'è un modello di leadership condiviso.
2. Alcuni capi applicano approcci Lean per iniziativa personale.
3. Formazione avviata per i capi; presenza sul campo (gemba) incostante.
4. Capi formati e presenti sul campo con regolarità, che sostengono le persone nel risolvere i problemi.
5. Leadership Lean coerente a tutti i livelli, con affiancamento e crescita dei collaboratori.

**d7q2 — Coinvolgimento delle persone**
1. Le persone eseguono; le idee di miglioramento non vengono raccolte.
2. Le idee vengono raccolte in modo informale e senza riscontro.
3. Sistema di raccolta idee attivo, con riscontro parziale.
4. Le persone partecipano a gruppi di miglioramento, con riscontro e riconoscimento.
5. Le persone guidano il miglioramento nella propria area, con autonomia decisionale.

**d7q3 — Competenze e formazione**
1. Formazione solo obbligatoria o occasionale.
2. Formazione su richiesta, senza un piano.
3. Piano formativo per i ruoli chiave.
4. Piano formativo collegato ai bisogni del business, con verifica dell'applicazione.
5. Sviluppo strutturato delle competenze, con percorsi di crescita e trasferimento delle conoscenze tra le persone.

### Anagrafica

- `nome`: nome e cognome, testo, obbligatorio.
- `azienda`: testo, obbligatorio.
- `email`: formato email valido, obbligatorio.
- `ruolo`: testo libero, obbligatorio.
- `settore`: elenco chiuso, obbligatorio. Valori: Meccanica e macchinari; Arredo e legno; Elettrodomestici, elettronica ed elettromeccanica; Automotive e componentistica; Chimica, plastica e materiali; Alimentare e beverage; Servizi e consulenza; Altro.
- `dimensione`: elenco chiuso, obbligatorio. Valori: Fino a 50 dipendenti; 51-250 dipendenti; Oltre 250 dipendenti.

## 4. Calcolo e schermata del risultato

Calcoli in un modulo puro `src/survey/scoring.js`, senza dipendenze da React, con test unitari.

- **Punteggio dimensione**: media delle 3 risposte, poi `pct = (media - 1) / 4 * 100`. Media 1 = 0%, media 5 = 100%. Arrotondare all'intero per la visualizzazione, usare il valore non arrotondato per i calcoli.
- **Punteggio complessivo**: media dei 7 punteggi di dimensione.
- **Livello di maturità** (sul valore arrotondato, sia complessivo sia di dimensione, dove per la dimensione si parla di "fascia" 1-5):
  - 0-20% = Iniziale (fascia 1)
  - 21-40% = Emergente (fascia 2)
  - 41-60% = Strutturato (fascia 3)
  - 61-80% = Consolidato (fascia 4)
  - 81-100% = Eccellente (fascia 5)
- **Punti di forza**: le 2 dimensioni con punteggio più alto. **Aree di attenzione**: le 2 con punteggio più basso. A parità di punteggio vince l'ordine di dimensione d1...d7. Sono 7 dimensioni, quindi le due liste non si sovrappongono.

Schermata del risultato, dall'alto in basso:

1. Saluto con nome e azienda.
2. Punteggio complessivo in grande (es. 58%) con il nome del livello.
3. Radar a 7 assi, scala 0-100%, una sola serie (il partecipante). Realizzarlo in SVG scritto a mano, senza librerie di grafici nuove. Etichette brevi degli assi: Lean e flussi; Miglioramento continuo; Governance; Decisioni e trade-off; Digitalizzazione; Intelligenza artificiale; Persone e leadership.
4. Blocco "Punti di forza" e blocco "Aree di attenzione": per ciascuna delle 2 dimensioni, nome e frase di lettura presa da `frasi.js[dimensione][fascia]`.
5. Messaggio finale, esattamente: "Ti arriverà via mail la tua situazione rispetto al benchmark di riferimento del tuo settore e della media di tutte le aziende."

Non mostrare il dettaglio numerico per dimensione né le singole risposte. Non mostrare nessun benchmark. Non indicare date di arrivo del benchmark.

## 5. Consenso e privacy

Tre caselle, non preselezionate:

1. Ho letto l'informativa privacy (obbligatorio). Testo dell'informativa: `[[INFORMATIVA_PRIVACY — testo da fornire da BPR]]`, con identificativo di versione.
2. Acconsento all'uso dei miei dati in forma aggregata e anonima per costruire benchmark, anche in analisi future (obbligatorio).
3. Acconsento a essere contattato da BPR per approfondimenti sui risultati (facoltativo).

Salvare con la risposta: stato delle tre caselle, versione del testo, timestamp.

## 6. Dati (Firestore)

Nuova collezione `survey_risposte`, un documento per risposta completa, id automatico. Non toccare le collezioni del game (`tavoli`, `opzioni`, `sessione`, `scelte`).

Campi:
- `campagna`: costante di configurazione, valore iniziale `2026-09-29-belforte`
- `creato_at`: timestamp del server
- `consenso`: `{ privacy: bool, benchmark_aggregato: bool, contatto_bpr: bool, versione_testo: string }`
- `anagrafica`: `{ nome, azienda, email, ruolo, settore, dimensione }`
- `risposte`: mappa con 21 chiavi (`d1q1` ... `d7q3`), valori interi da 1 a 5
- `punteggi`: `{ d1..d7: number (0-100), totale: number }` calcolati sul client, solo per comodità; lo script di report li ricalcola dalle risposte.

Salvare solo questionari completi: si scrive un solo documento, all'invio finale.

## 7. Sicurezza — punto critico

Le regole Firestore attuali del progetto sono completamente aperte (`allow read, write: if true`). Su `survey_risposte` NON possono restare così: contiene nomi, email e dati aziendali.

Attenzione: in Firestore le regole si sommano in OR. Se esiste una regola generica come `match /{document=**} { allow read, write: if true; }`, questa dà accesso anche alla nuova collezione, qualunque cosa si scriva sotto. Quindi:

1. Aprire il file delle regole del repo (o del progetto Firebase) e verificare com'è scritto.
2. Sostituire l'eventuale regola generica con regole esplicite per le quattro collezioni del game, mantenendo il loro comportamento attuale (`read, write: if true`).
3. Per `survey_risposte`: `allow create` solo se il documento ha esattamente i campi previsti, `risposte` contiene le 21 chiavi con interi da 1 a 5, `consenso.privacy` e `consenso.benchmark_aggregato` sono `true`, e le stringhe hanno lunghezze ragionevoli; `allow read, update, delete: if false`.
4. Le letture avvengono solo dallo script di export con le credenziali di amministrazione (Admin SDK), che non passano dalle regole.

Il game non deve subire regressioni: dopo la modifica verificare che Tavolo, Regia, Dashboard e Config funzionino come prima.

Configurazione Firebase separabile: inizializzare per il survey una istanza dedicata (`initializeApp(config, 'survey')`) con config da variabili `VITE_SURVEY_FIREBASE_*`, che se non valorizzate ricadono sulla config del game. Serve perché se la regione del database attuale non è in UE potremo puntare il survey a un progetto Firebase separato senza toccare il codice.

## 8. Export per il report

Script `scripts/export-survey.mjs` (Node), da lanciare a mano, con `firebase-admin` e un file di service account fornito via variabile d'ambiente `GOOGLE_APPLICATION_CREDENTIALS`. Il file delle credenziali non deve mai essere committato: aggiungere il pattern a `.gitignore`.

- Legge tutti i documenti di `survey_risposte` per la `campagna` indicata come argomento.
- Scrive `survey_export.json` con i documenti in chiaro (id, campi completi, timestamp in ISO) e stampa un riepilogo: numero di risposte, numero per settore.
- Aggiungere anche `survey_export.json` a `.gitignore`: contiene dati personali.
- Il calcolo dei benchmark e la produzione dei PDF non fanno parte dell'app: verranno fatti a parte a partire da questo file.

## 9. Elementi ancora da fornire

- `src/survey/frasi.js`: 35 frasi di lettura (7 dimensioni × 5 fasce), in formato `{ d1: { 1: "...", 2: "...", ... 5: "..." }, ... }`. Nel frattempo creare il file con segnaposto del tipo `"[[FRASE d1 fascia 1]]"` e gestire la struttura; le frasi vere arrivano a parte.
- Testo dell'informativa privacy (sezione 5).
- Verificare la regione del database Firestore del progetto attuale: se non è in UE, usare un progetto Firebase separato in UE per il survey.

## 10. Verifica

Dall'ambiente di sviluppo non si raggiunge il sito pubblicato né Firestore, quindi:

- Test unitari su `scoring.js`: punteggi ai limiti (tutte risposte 1, tutte 5), arrotondamenti ai confini delle fasce (20/21, 40/41, 60/61, 80/81), pari merito nella scelta di forza e attenzione.
- Checklist di test manuale per Luca su dispositivi reali: compilazione completa da smartphone, ricarica a metà, perdita di rete e "Riprova", riapertura dopo il completamento, tentativo di lettura di `survey_risposte` dalla console del browser (deve fallire), verifica che il game continui a funzionare.
- Aggiornare il README del repo con il changelog del survey e le istruzioni di test, come per le funzioni precedenti.
