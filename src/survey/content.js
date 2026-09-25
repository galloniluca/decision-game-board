// Contenuto del questionario "Lean nell'era dell'incertezza".
// Trascritto alla lettera da SURVEY_SPEC.md (sezione 3): non modificare i testi
// senza aggiornare la specifica. Il test content.test.js verifica la corrispondenza.

// Identifica la raccolta: finisce nel campo `campagna` di ogni risposta.
export const CAMPAGNA = '2026-09-29-belforte'

// Versione del testo di informativa e consensi salvata con ogni risposta.
// Va incrementata quando cambia INFORMATIVA_PRIVACY o il testo dei consensi.
export const VERSIONE_TESTO_CONSENSO = 'bozza-0'

export const INFORMATIVA_PRIVACY = '[[INFORMATIVA_PRIVACY — testo da fornire da BPR]]'

export const CONSENSI = [
  { id: 'privacy', obbligatorio: true, testo: "Ho letto l'informativa privacy" },
  {
    id: 'benchmark_aggregato',
    obbligatorio: true,
    testo:
      'Acconsento all\'uso dei miei dati in forma aggregata e anonima per costruire benchmark, anche in analisi future',
  },
  {
    id: 'contatto_bpr',
    obbligatorio: false,
    testo: 'Acconsento a essere contattato da BPR per approfondimenti sui risultati',
  },
]

export const SETTORI = [
  'Meccanica e macchinari',
  'Arredo e legno',
  'Elettrodomestici, elettronica ed elettromeccanica',
  'Automotive e componentistica',
  'Chimica, plastica e materiali',
  'Alimentare e beverage',
  'Servizi e consulenza',
  'Altro',
]

export const DIMENSIONI_AZIENDA = ['Fino a 50 dipendenti', '51-250 dipendenti', 'Oltre 250 dipendenti']

// Messaggio in fondo alla schermata del risultato (testo esatto dalla specifica, sezione 4).
export const MESSAGGIO_FINALE =
  'Ti arriverà via mail la tua situazione rispetto al benchmark di riferimento del tuo settore e della media di tutte le aziende.'

// Campi anagrafica, nell'ordine di visualizzazione.
export const CAMPI_ANAGRAFICA = [
  { id: 'nome', etichetta: 'Nome e cognome', tipo: 'text', autocomplete: 'name' },
  { id: 'azienda', etichetta: 'Azienda', tipo: 'text', autocomplete: 'organization' },
  { id: 'email', etichetta: 'Email', tipo: 'email', autocomplete: 'email' },
  { id: 'ruolo', etichetta: 'Ruolo', tipo: 'text', autocomplete: 'organization-title' },
  { id: 'settore', etichetta: 'Settore', tipo: 'select', opzioni: SETTORI },
  { id: 'dimensione', etichetta: 'Dimensione aziendale', tipo: 'select', opzioni: DIMENSIONI_AZIENDA },
]

// Limite di lunghezza per i campi di testo (lo stesso vale nelle regole Firestore).
export const MAX_LUNGHEZZA_TESTO = 200

// 7 dimensioni × 3 domande × 5 ancore (livelli 1-5, in ordine).
export const DIMENSIONI = [
  {
    id: 'd1',
    titolo: "Lean e flussi",
    breve: "Lean e flussi",
    domande: [
      {
        id: 'd1q1',
        titolo: "Mappatura dei flussi di valore",
        ancore: [
          "I flussi non sono mappati.",
          "Mappati in modo sporadico, solo in singoli progetti.",
          "I flussi principali sono mappati (VSM) ma non vengono aggiornati.",
          "Mappati e usati per scegliere le priorità di miglioramento.",
          "Mappati, aggiornati con regolarità e usati per decisioni end-to-end, fornitori e clienti compresi.",
        ],
      },
      {
        id: 'd1q2',
        titolo: "Standard di lavoro",
        ancore: [
          "Ognuno lavora a modo proprio, senza standard.",
          "Standard presenti solo in alcune aree e poco rispettati.",
          "Standard formalizzati sulle attività chiave, con rispetto variabile.",
          "Standard diffusi e verificati con audit periodici.",
          "Standard vivi, aggiornati da chi li esegue e base del miglioramento continuo.",
        ],
      },
      {
        id: 'd1q3',
        titolo: "Stabilità e regolarità del flusso",
        ancore: [
          "Produzione a spinta, forti oscillazioni, gestione continua delle urgenze.",
          "Alcuni tentativi di livellamento, senza continuità.",
          "Logiche pull o livellamento attive in alcune aree.",
          "Flusso regolare nella maggior parte dei processi, con lead time e WIP misurati.",
          "Flusso tirato e livellato end-to-end, con lead time e WIP gestiti attivamente.",
        ],
      },
    ],
  },
  {
    id: 'd2',
    titolo: "Miglioramento continuo e problem solving",
    breve: "Miglioramento continuo",
    domande: [
      {
        id: 'd2q1',
        titolo: "Metodo di problem solving",
        ancore: [
          "I problemi si risolvono caso per caso, senza un metodo.",
          "Il metodo esiste ma lo usano in pochi (es. 5 Why, A3) e solo per problemi gravi.",
          "Metodo strutturato adottato nelle funzioni principali, con analisi delle cause radice non sempre sistematica.",
          "Metodo diffuso e applicato con regolarità; le azioni correttive vengono verificate nella loro efficacia.",
          "Metodo patrimonio comune a tutti i livelli; le cause radice vengono eliminate e la soluzione viene estesa ad altre aree.",
        ],
      },
      {
        id: 'd2q2',
        titolo: "Sistema di miglioramento continuo (Kaizen)",
        ancore: [
          "Non c'è un sistema; il miglioramento avviene solo in occasione di progetti o emergenze.",
          "Iniziative Kaizen occasionali, promosse da singole persone.",
          "Sistema strutturato (eventi Kaizen, gestione delle idee) attivo solo in alcune aree.",
          "Sistema attivo e con calendario, con risultati misurati e condivisi.",
          "Miglioramento continuo integrato nel lavoro quotidiano di tutti, con risultati collegati agli obiettivi aziendali.",
        ],
      },
      {
        id: 'd2q3',
        titolo: "Gestione visiva e routine quotidiane",
        ancore: [
          "Nessun momento strutturato di confronto sull'andamento del lavoro.",
          "Riunioni o lavagne sporadiche, senza un formato definito.",
          "Routine quotidiane (es. tier meeting, management visivo) presenti in alcune aree.",
          "Routine diffuse, con indicatori aggiornati e azioni tracciate.",
          "Routine consolidate su più livelli, con escalation dei problemi chiara e tempestiva.",
        ],
      },
    ],
  },
  {
    id: 'd3',
    titolo: "Governance e strumenti decisionali",
    breve: "Governance",
    domande: [
      {
        id: 'd3q1',
        titolo: "KPI e cruscotti",
        ancore: [
          "Non ci sono KPI condivisi; ogni funzione guarda i propri numeri.",
          "KPI presenti ma diversi da funzione a funzione, con dati raccolti a mano e in ritardo.",
          "Set di KPI definito, con fonti dati chiare, ma consultato in modo discontinuo.",
          "Cruscotti aggiornati con regolarità e usati nelle riunioni per decidere.",
          "KPI collegati agli obiettivi strategici, a cascata sui vari livelli, con soglie e azioni predefinite.",
        ],
      },
      {
        id: 'd3q2',
        titolo: "Ruoli e responsabilità (RACI)",
        ancore: [
          "Ruoli e responsabilità impliciti; spesso non è chiaro chi decide.",
          "Definiti a livello di funzione, ma con sovrapposizioni e zone grigie nei processi trasversali.",
          "Ruoli formalizzati per i processi principali (es. RACI), applicati in modo variabile.",
          "Ruoli chiari e rispettati, con un responsabile (owner) per ogni processo chiave.",
          "Ruoli riesaminati periodicamente e coerenti con la governance dei processi end-to-end.",
        ],
      },
      {
        id: 'd3q3',
        titolo: "Pianificazione integrata (S&OP) e gate decisionali",
        ancore: [
          "Ogni funzione pianifica per conto proprio; l'allineamento avviene solo in caso di emergenza.",
          "Riunioni di allineamento saltuarie, senza un processo definito.",
          "Processo di pianificazione periodico (es. S&OP mensile), ma con partecipazione e decisioni non sempre efficaci.",
          "Processo consolidato, con dati condivisi, decisioni tracciate e verifica delle azioni.",
          "Pianificazione integrata su più orizzonti, con gate decisionali formali su progetti e investimenti.",
        ],
      },
    ],
  },
  {
    id: 'd4',
    titolo: "Decisioni e trade-off",
    breve: "Decisioni e trade-off",
    domande: [
      {
        id: 'd4q1',
        titolo: "Consapevolezza dei trade-off",
        ancore: [
          "I trade-off (costo, servizio, scorte, flessibilità, qualità) non vengono discussi apertamente.",
          "Si riconoscono a parole, ma ognuno ottimizza il proprio obiettivo di funzione.",
          "I trade-off principali sono identificati e discussi nelle riunioni chiave.",
          "Trade-off esplicitati e valutati con dati, con effetti quantificati sulle funzioni coinvolte.",
          "Trade-off gestiti in modo sistematico, con criteri di priorità condivisi e scelte trasparenti.",
        ],
      },
      {
        id: 'd4q2',
        titolo: "Criteri e responsabilità della decisione",
        ancore: [
          "Decide chi urla di più o chi è più vicino al problema, senza criteri.",
          "Le decisioni le prende il vertice caso per caso, con criteri impliciti.",
          "Criteri definiti solo per alcune decisioni ricorrenti (es. livelli di scorta, priorità ordini).",
          "Criteri e livelli di autorità chiari per le principali decisioni, comunicati a tutti.",
          "Decisioni delegate al livello giusto, con criteri condivisi e revisione periodica degli esiti.",
        ],
      },
      {
        id: 'd4q3',
        titolo: "Gestione dell'incertezza",
        ancore: [
          "Si reagisce agli imprevisti quando si presentano.",
          "Si ha qualche margine (scorte di sicurezza, buffer) deciso a intuito.",
          "Scenari e rischi principali considerati in alcune decisioni.",
          "Scenari what-if usati regolarmente per le scelte su capacità, scorte e servizio.",
          "Piani di risposta e simulazioni integrati nella pianificazione, con revisione degli scostamenti tra previsto e reale.",
        ],
      },
    ],
  },
  {
    id: 'd5',
    titolo: "Digitalizzazione dei processi",
    breve: "Digitalizzazione",
    domande: [
      {
        id: 'd5q1',
        titolo: "Qualità e disponibilità dei dati",
        ancore: [
          "Dati sparsi su file e carta, spesso incoerenti.",
          "Dati nei sistemi principali, ma con molte rielaborazioni manuali e più \"versioni della verità\".",
          "Dati di base affidabili nei sistemi, con qualche integrazione tra le aree.",
          "Dati affidabili e coerenti tra i sistemi, con responsabili definiti (data owner).",
          "Dati affidabili in tempo reale e disponibili a tutti i livelli decisionali.",
        ],
      },
      {
        id: 'd5q2',
        titolo: "Digitalizzazione dei processi transazionali",
        ancore: [
          "Processi prevalentemente su carta, fogli di calcolo e email.",
          "Alcuni processi supportati da gestionale, con molti passaggi manuali.",
          "Processi principali (es. ordini, acquisti, produzione) su gestionale, con eccezioni gestite a mano.",
          "Processi digitalizzati end-to-end nelle aree chiave, con automazioni e controlli.",
          "Processi progettati in modo snello prima di digitalizzarli, con automazione diffusa e continuo miglioramento.",
        ],
      },
      {
        id: 'd5q3',
        titolo: "Integrazione dei sistemi",
        ancore: [
          "Sistemi separati, senza scambio automatico di dati.",
          "Scambi dati manuali tra i sistemi (import/export).",
          "Alcune integrazioni tra sistemi principali (es. ERP e produzione).",
          "Integrazione estesa, con flussi automatici tra funzioni.",
          "Architettura integrata anche con clienti e fornitori, scalabile e governata.",
        ],
      },
    ],
  },
  {
    id: 'd6',
    titolo: "Intelligenza artificiale",
    breve: "Intelligenza artificiale",
    domande: [
      {
        id: 'd6q1',
        titolo: "Utilizzo reale",
        ancore: [
          "Non utilizziamo l'AI.",
          "Uso individuale e non coordinato (es. strumenti generici usati dai singoli).",
          "Alcuni casi d'uso in sperimentazione in singole funzioni.",
          "Casi d'uso in produzione in diverse aree, con benefici misurati.",
          "AI integrata nei processi principali e nelle decisioni, con risultati misurati e ripetibili.",
        ],
      },
      {
        id: 'd6q2',
        titolo: "Governance e regole d'uso",
        ancore: [
          "Nessuna regola sull'uso dell'AI.",
          "Indicazioni informali su cosa è ammesso o vietato.",
          "Politica aziendale definita (dati riservati, strumenti autorizzati), con applicazione non uniforme.",
          "Politica applicata, con ruoli responsabili e controllo degli usi.",
          "Governance completa: rischi, qualità dei risultati, tracciabilità e revisione periodica.",
        ],
      },
      {
        id: 'd6q3',
        titolo: "Competenze e cultura",
        ancore: [
          "Poche persone conoscono l'AI e il suo potenziale.",
          "Interesse diffuso, senza formazione strutturata.",
          "Formazione avviata su gruppi selezionati.",
          "Competenze diffuse, con persone di riferimento (champion) nelle funzioni.",
          "Cultura consolidata: le persone propongono e validano casi d'uso, sapendo quando fidarsi dell'output.",
        ],
      },
    ],
  },
  {
    id: 'd7',
    titolo: "Persone e leadership",
    breve: "Persone e leadership",
    domande: [
      {
        id: 'd7q1',
        titolo: "Leadership Lean",
        ancore: [
          "I capi gestiscono soprattutto le urgenze; non c'è un modello di leadership condiviso.",
          "Alcuni capi applicano approcci Lean per iniziativa personale.",
          "Formazione avviata per i capi; presenza sul campo (gemba) incostante.",
          "Capi formati e presenti sul campo con regolarità, che sostengono le persone nel risolvere i problemi.",
          "Leadership Lean coerente a tutti i livelli, con affiancamento e crescita dei collaboratori.",
        ],
      },
      {
        id: 'd7q2',
        titolo: "Coinvolgimento delle persone",
        ancore: [
          "Le persone eseguono; le idee di miglioramento non vengono raccolte.",
          "Le idee vengono raccolte in modo informale e senza riscontro.",
          "Sistema di raccolta idee attivo, con riscontro parziale.",
          "Le persone partecipano a gruppi di miglioramento, con riscontro e riconoscimento.",
          "Le persone guidano il miglioramento nella propria area, con autonomia decisionale.",
        ],
      },
      {
        id: 'd7q3',
        titolo: "Competenze e formazione",
        ancore: [
          "Formazione solo obbligatoria o occasionale.",
          "Formazione su richiesta, senza un piano.",
          "Piano formativo per i ruoli chiave.",
          "Piano formativo collegato ai bisogni del business, con verifica dell'applicazione.",
          "Sviluppo strutturato delle competenze, con percorsi di crescita e trasferimento delle conoscenze tra le persone.",
        ],
      },
    ],
  },
]

// Elenco piatto dei 21 id domanda (d1q1 ... d7q3).
export const ID_DOMANDE = DIMENSIONI.flatMap((d) => d.domande.map((q) => q.id))
