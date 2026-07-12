-- ============================================================
-- IL METODO ARGO — Seed contenuti dei 21 giorni
-- Eseguire DOPO schema-database.sql.
--
-- Fase 1 (giorni 1-7) e Fase 3 (giorni 17-21): contenuto reale,
-- allineato a metodo-argo-prodotto.md — modificabile in ogni
-- momento dalla dashboard Supabase (Table editor → course_days).
--
-- Fase 2 (giorni 8-16, 5 moduli): titoli definitivi + contenuto
-- segnaposto. I 9 giorni di ciascun modulo sono il prossimo
-- contenuto da produrre: basta aggiornare la colonna `content`.
-- ============================================================

-- ------------------------------------------------------------
-- FASE 1 — FONDAMENTA (giorni 1-7, uguale per tutti)
-- ------------------------------------------------------------
insert into public.course_days (day_number, phase, module, title, subtitle, content, checklist) values

(1, 1, null,
 'Il patto',
 'Prima di insegnarmi qualcosa, guardami.',
 E'Ciao. Sono Argo, e da oggi lavoriamo insieme.\n\nOggi non mi insegni niente. Lo so, non vedevi l''ora. Ma il primo giorno serve a te, non a me: devi capire chi hai davanti.\n\n**Cosa fare oggi**\n\nOsservami per tre momenti della giornata — mattina, pomeriggio, sera — e scrivi sul tracker cosa faccio quando nessuno mi chiede niente. Dove mi metto? Cosa guardo? Quando mi agito?\n\nPoi riunisci la famiglia e decidete **tre regole della casa**, chiare e uguali per tutti. Sul divano sì o no? Cibo dal tavolo sì o no? Se tu dici no e tua figlia dice sì, io scelgo sì. Sempre.\n\n**Quello che vedi:** un cane che non fa niente di speciale.\n**Quello che succede:** stai raccogliendo i dati che renderanno tutto il resto dieci volte più facile.',
 '["Ho osservato il mio cane in 3 momenti diversi", "Abbiamo scelto le 3 regole della casa", "Tutta la famiglia è d''accordo sulle regole", "Ho stampato il tracker dei 21 giorni"]'),

(2, 1, null,
 'Il mio nome non è "No"',
 'Il gioco del nome: quando mi chiami, vinco qualcosa.',
 E'Sai qual è la parola che sento più spesso? "No". A volte penso sia il mio secondo nome.\n\nOggi sistemiamo la cosa più importante di tutte: quando dici il mio nome, io devo **voltarmi verso di te**. Non per magia — perché conviene.\n\n**L''esercizio (5 minuti, 3 volte oggi)**\n\n1. Stanza tranquilla, premietti piccoli in tasca.\n2. Di'' il mio nome UNA volta, con voce allegra.\n3. Appena giro la testa verso di te: premio immediato. Entro un secondo.\n4. Se non mi giro, non ripetere il nome dieci volte — avvicinati, riprova più facile.\n\n**Regola d''oro:** il mio nome non si usa mai per sgridarmi. Mai. Se il nome significa "guai in arrivo", smetterò di ascoltarlo. Se significa "arriva qualcosa di buono", ti ascolterò anche al parco tra venti piccioni.',
 '["Sessione 1 (5 min) fatta", "Sessione 2 (5 min) fatta", "Sessione 3 (5 min) fatta", "Nessuno oggi ha usato il nome per sgridare"]'),

(3, 1, null,
 'La parola magica',
 'Il marker: come dirmi "esatto, proprio quello!" al momento giusto.',
 E'Il tuo problema non è che io non capisco. È che me lo dici tardi.\n\nSe mi siedo e tu mi premi otto secondi dopo, per me il premio è arrivato per... boh, aver guardato il muro? Oggi impari il **marker**: una parola breve — "Sì!" va benissimo — detta nell''istante esatto in cui faccio la cosa giusta, sempre seguita dal premio.\n\n**L''esercizio "carica il Sì" (5 minuti, 3 volte)**\n\n1. Di'' "Sì!" e dammi subito un premietto. Non devo fare niente.\n2. Ripeti 10 volte. Pausa. Ripeti.\n3. Dal pomeriggio: di'' "Sì!" solo quando faccio qualcosa che ti piace (mi siedo da solo, ti guardo, sto calmo) e premia subito.\n\n**Quello che vedi:** un umano che dice "Sì" a un cane.\n**Quello che succede:** stai costruendo una macchina fotografica: il "Sì" scatta la foto del comportamento giusto, il premio la stampa.',
 '["Ho scelto la parola marker (es. Sì!)", "Sessione di carica del marker fatta", "Ho marcato almeno 5 comportamenti spontanei giusti", "Premio sempre entro 1 secondo dal marker"]'),

(4, 1, null,
 'Seduto (ma sul serio)',
 'Non il seduto da circo. Il seduto che mi calma.',
 E'"Ma il mio cane il seduto lo sa già!" Sì, lo so anch''io. Lo sappiamo tutti. Il punto non è sapere il seduto: è **scegliere di sedersi** quando intorno succedono cose.\n\n**L''esercizio (5 minuti, 3 volte)**\n\n1. Premietto nel pugno chiuso, sopra il mio naso, spostalo lentamente indietro sopra la mia testa.\n2. Il mio sedere tocca terra? "Sì!" + premio.\n3. Dopo 5 riuscite, togli il premio dalla mano: solo il gesto. "Sì!" + premio dall''altra mano.\n4. Solo quando il gesto funziona 8 volte su 10, aggiungi la parola "seduto" PRIMA del gesto.\n\n**Errore classico:** ripetere "seduto-seduto-SEDUTO" come un disco rotto. Una volta sola. Se non funziona, l''esercizio è troppo difficile: torna al passo prima.\n\nDa oggi, sedersi diventa il mio modo di dire "per favore": prima della ciotola, prima del guinzaglio, prima della porta.',
 '["Sessione 1: seduto con la mano (lure)", "Sessione 2: seduto con solo il gesto", "Seduto chiesto prima della ciotola", "Ho detto la parola una volta sola, sempre"]'),

(5, 1, null,
 'L''arte di non fare niente',
 'Il relax su comando esiste. E ti cambierà la vita.',
 E'Gli umani pensano che educare un cane significhi insegnargli a FARE cose. Poi vivono con un cane che non sa STARE.\n\nOggi lavoriamo sul **terra rilassato**: non l''esercizio militare, ma la capacità di sdraiarmi e mollare la tensione mentre la vita va avanti.\n\n**L''esercizio della coperta (10 minuti, 2 volte)**\n\n1. Stendi una coperta o un tappetino: quello sarà il mio posto.\n2. Portami sopra con un premietto, aspetta che mi sdraio da solo. Non dire niente. Aspetta.\n3. Appena mi sdraio: premio tra le zampe, con calma, senza festa.\n4. Ogni volta che resto giù, ogni tanto, un premio tra le zampe. Se mi alzo, nessun dramma: aspetta che torni giù.\n5. Fine sessione: "ok, libero!" e via la coperta.\n\n**Quello che vedi:** un cane sdraiato che non fa niente.\n**Quello che succede:** sto imparando che rilassarmi PAGA. È l''esercizio più sottovalutato del mondo.',
 '["Ho scelto coperta/tappetino dedicato", "Sessione 1: si è sdraiato da solo almeno una volta", "Sessione 2: è rimasto giù più a lungo", "Premi dati con calma, senza eccitarlo"]'),

(6, 1, null,
 'Aspetta, che fretta c''è',
 'Autocontrollo: la ciotola, la porta, e io che imparo a scegliere.',
 E'Ti svelo un segreto di noi cani: l''autocontrollo non ce l''abbiamo di fabbrica. Si installa. E oggi facciamo il primo aggiornamento.\n\n**Esercizio 1 — La ciotola paziente (a ogni pasto)**\n\n1. Prepara la ciotola. Io ovviamente ballo il tip tap.\n2. Abbassala lentamente: se mi lancio, la ciotola risale. Senza dire niente.\n3. Riprova. La ciotola arriva a terra solo se io resto seduto.\n4. "Ok!" → posso mangiare. La parola di libertà è importante quanto l''attesa.\n\n**Esercizio 2 — La porta non è un cancello di partenza (2 volte oggi)**\n\nStessa logica con la porta di casa: la maniglia si abbassa solo se io sono seduto. Se scatto, la porta si richiude. Io imparo: la calma apre le porte. Letteralmente.\n\n**Attenzione:** niente punizioni, niente strattoni. È un gioco di conseguenze: la fretta allontana quello che voglio, la calma lo avvicina.',
 '["Ciotola paziente al pasto della mattina", "Ciotola paziente al pasto della sera", "Esercizio della porta fatto 2 volte", "Ho sempre usato la parola di libertà (Ok!)"]'),

(7, 1, null,
 'Il tagliando',
 'Ripasso generale e test: le fondamenta reggono?',
 E'Una settimana insieme. Se sei arrivato fin qui, ho una notizia: sei già nel 20% degli umani che non mollano. Io lo sapevo, comunque.\n\nOggi niente esercizi nuovi. Oggi si collauda.\n\n**Il test delle fondamenta (10 minuti)**\n\n1. **Nome:** dillo una volta mentre guardo altrove. Mi giro? ✔\n2. **Seduto:** solo gesto, senza premio in mano. Mi siedo? ✔\n3. **Coperta:** mi porti sul posto, ti allontani di due passi. Resto giù 30 secondi? ✔\n4. **Ciotola:** resto seduto finché non dici "Ok"? ✔\n5. **Porta:** seduto mentre la apri? ✔\n\n**4-5 su 5:** fondamenta solide, da domani si entra nel TUO modulo.\n**2-3 su 5:** normale. Rifai oggi gli esercizi zoppicanti, domani si parte lo stesso.\n**0-1 su 5:** nessun dramma: riparti dal giorno 2 e prenditi due giorni in più. I 21 giorni sono una guida, non un ultimatum.\n\nDa domani si fa sul serio: si lavora sul MIO problema. Anzi, sul nostro.',
 '["Test del nome superato", "Test del seduto superato", "Test della coperta superato", "Test di ciotola e porta superato", "Ho segnato i risultati sul tracker"]');

-- ------------------------------------------------------------
-- FASE 3 — CONSOLIDAMENTO (giorni 17-21, uguale per tutti)
-- ------------------------------------------------------------
insert into public.course_days (day_number, phase, module, title, subtitle, content, checklist) values

(17, 3, null,
 'Il mondo là fuori',
 'Generalizzare: quello che so in cucina, non lo so ancora al parco.',
 E'Devo confessarti una cosa imbarazzante di noi cani: se imparo il seduto in cucina, per me esiste il "seduto-in-cucina". Il "seduto-al-parco" è un altro esame, mai preparato.\n\nSi chiama **generalizzazione**, ed è il motivo per cui "a casa lo fa benissimo!" è la frase più detta dagli umani ai giardinetti.\n\n**Cosa fare oggi**\n\nPrendi 3 esercizi che ormai mi vengono facili a casa e rifalli in 3 posti nuovi, in ordine di difficoltà:\n\n1. Un''altra stanza o il balcone (facile)\n2. Davanti a casa, marciapiede tranquillo (medio)\n3. Un angolo calmo del parco (difficile)\n\n**Regola:** in ogni posto nuovo, abbassa le pretese del 50%. Premia di più, chiedi di meno. Non è un passo indietro: è come si costruisce un cane affidabile ovunque.',
 '["3 esercizi ripassati in una stanza diversa", "Stessi esercizi davanti a casa", "Stessi esercizi in un angolo calmo del parco", "Ho premiato di più del solito nei posti nuovi"]'),

(18, 3, null,
 'Distrazioni professionali',
 'Piccioni, altri cani, bambini con panini: allenarsi nel rumore del mondo.',
 E'Ieri abbiamo cambiato i luoghi. Oggi alziamo il volume: le **distrazioni**.\n\nPer me una distrazione non è "una cosa carina da guardare". È un richiamo irresistibile scritto nel mio DNA. Il piccione non è un uccello: è un evento.\n\n**La scala delle distrazioni (15 minuti al parco)**\n\n1. Trova la distanza alla quale vedo la distrazione ma riesco ancora ad ascoltarti. Cinque metri? Venti? Quella è la nostra **linea di lavoro**.\n2. A quella distanza: nome → mi giro → "Sì!" → premio. Seduto → "Sì!" → premio.\n3. Funziona 8 volte su 10? Avvicinati di DUE passi. Non dieci. Due.\n4. Sbaglio due volte di fila? Troppo vicino: allontanati e riprova.\n\n**Quello che vedi:** passi avanti ridicolmente piccoli.\n**Quello che succede:** stai insegnando al mio cervello che tu vali più del piccione. Serve tempo: il piccione ha milioni di anni di vantaggio.',
 '["Trovata la distanza di lavoro dalla distrazione", "Esercizi riusciti 8/10 a quella distanza", "Mi sono avvicinato solo di 2 passi alla volta", "Chiuso la sessione con un successo facile"]'),

(19, 3, null,
 'Ospiti a casa',
 'Il campanello, i saluti, e io che non travolgo la zia.',
 E'Il campanello. Ah, il campanello. Per te è "qualcuno alla porta". Per me è l''allarme rosso, la festa nazionale e l''invasione aliena, tutto insieme.\n\nOggi mettiamo insieme tutto quello che abbiamo costruito e lo applichiamo alla scena più difficile: **gli ospiti**.\n\n**La prova generale (serve un complice)**\n\n1. Chiedi a un amico di suonare il campanello. Tu NON apri subito.\n2. Mi porti sulla mia coperta (giorno 5, ricordi?). Seduto o terra. "Sì!" + premio.\n3. Solo quando sono relativamente calmo, la porta si apre. Se esplodo, l''ospite... richiude. Come la ciotola del giorno 6: la calma apre le porte.\n4. L''ospite mi saluta SOLO quando ho quattro zampe a terra. Se salto, diventa una statua noiosa.\n\n**Nota di Argo:** avvisa l''ospite prima. Gli umani non addestrati sono la variabile più imprevedibile dell''esercizio.',
 '["Prova campanello fatta con un complice", "Ho usato la coperta come postazione", "L''ospite ha salutato solo a 4 zampe a terra", "Ripetuto almeno 3 volte"]'),

(20, 3, null,
 'Una giornata vera',
 'Niente sessioni: oggi il metodo si scioglie dentro la vita normale.',
 E'Oggi cambia tutto: **niente sessioni di allenamento**. Zero. Oggi il Metodo non si pratica: si vive.\n\nDa stamattina a stasera, usa quello che abbiamo costruito dentro la giornata normale:\n\n- Sveglia → seduto prima di uscire dalla porta\n- Colazione → ciotola paziente, come niente fosse\n- Passeggiata → nome + premio quando ti guardo spontaneamente\n- Tu lavori → io sulla coperta, con qualcosa da masticare\n- Campanello o incontro → la routine di ieri\n- Sera → cinque minuti di coccole senza chiedermi niente. Anche questo è metodo.\n\n**Quello che vedi:** una giornata qualsiasi.\n**Quello che succede:** il passaggio dal "fare gli esercizi" all''"essere una squadra". È qui che i 21 giorni diventano il resto della nostra vita.\n\nStasera, sul tracker, scrivi la cosa più bella che ho fatto oggi senza che tu chiedessi niente.',
 '["Routine del mattino con il metodo dentro", "Passeggiata con attenzione spontanea premiata", "Momento di calma sulla coperta durante il giorno", "Scritta sul tracker la cosa più bella di oggi"]'),

(21, 3, null,
 'Il diploma',
 'Test finale, festa, e il piano per non perdere quello che abbiamo costruito.',
 E'Ventuno giorni. Ce l''abbiamo fatta. Cioè: TU ce l''hai fatta, io lo sapevo dall''inizio di esserne capace.\n\n**Il test finale (al parco, 15 minuti)**\n\n1. Nome con distrazione in vista → mi giro ✔\n2. Seduto a distanza di guinzaglio, solo gesto ✔\n3. Due minuti di calma sulla coperta o accanto a te ✔\n4. La prova del TUO modulo (quella per cui sei arrivato qui) ✔\n5. Saluto a una persona senza saltare ✔\n\n**Poi festeggia.** Sul serio. Gioco libero, corsa, il mio snack preferito. Gli umani sottovalutano sempre la festa.\n\n**Il piano di mantenimento** (ultima pagina del tracker):\n\n- 5 minuti di pratica al giorno, dentro la vita normale\n- 1 volta a settimana: un posto nuovo\n- Le 3 regole della casa non vanno mai in vacanza\n\nE se qualcosa si arrugginisce? Questi 21 giorni restano tuoi: si torna sul giorno che serve e si ripassa. Io sono qui.\n\nFirmato: Argo, il primo educatore cinofilo che è un cane. 🐾',
 '["Test finale: almeno 4 prove su 5 superate", "Festa fatta come si deve", "Piano di mantenimento compilato sul tracker", "Foto ricordo del diploma (facoltativa ma consigliata)"]');

-- ------------------------------------------------------------
-- FASE 2 — I 5 MODULI (giorni 8-16, uno per profilo)
-- Contenuto segnaposto: titoli definitivi, testo in scrittura.
-- Aggiornare `content` (ed eventualmente `checklist`) man mano
-- che i giorni vengono scritti.
-- ------------------------------------------------------------
do $$
declare
  m record;
  titles text[];
  i integer;
begin
  for m in
    select * from (values
      ('trattore',    'Il Trattore',          'guinzaglio che non tira',
       array['Perché tiro (spoiler: funziona)', 'L''attrezzatura giusta', 'Il guinzaglio molle paga',
             'Un metro alla volta', 'Cambio di direzione', 'La via di casa',
             'Distrazioni al guinzaglio', 'La passeggiata vera', 'Test del Trattore']),
      ('squalo',      'Lo Squalo',            'i morsi del cucciolo',
       array['Perché mordo tutto', 'Le regole della bocca', 'Il gioco che insegna',
             'Ahi! e stop del gioco', 'Alternative da masticare', 'Le mani non sono prede',
             'Ospiti a prova di squalo', 'La calma dopo il gioco', 'Test dello Squalo']),
      ('esploratore', 'L''Esploratore Sordo', 'il richiamo che funziona',
       array['Perché non torno', 'La parola nuova', 'Il richiamo in casa',
             'Il giardino e la lunghina', 'Il premio jackpot', 'Richiamo con distrazioni',
             'Il parco (con rete di sicurezza)', 'Libertà guadagnata', 'Test dell''Esploratore']),
      ('velcro',      'Il Velcro',            'stare da solo senza drammi',
       array['Perché non ti stacco gli occhi di dosso', 'L''indipendenza in casa', 'La porta che va e viene',
             'Minuti da solo (pochi)', 'I rituali di uscita', 'Da solo più a lungo',
             'Le uscite vere', 'La routine che tranquillizza', 'Test del Velcro']),
      ('tornado',     'Il Tornado',           'autocontrollo ed energia',
       array['Perché esplodo', 'Scaricare prima di chiedere', 'Il gioco on/off',
             'Calma a comando', 'L''attesa che allena', 'Energia nei posti giusti',
             'Il mondo senza esplosioni', 'La giornata equilibrata', 'Test del Tornado'])
    ) as t(slug, nome, tema, giorni)
  loop
    titles := m.giorni;
    for i in 1..9 loop
      insert into public.course_days (day_number, phase, module, title, subtitle, content, checklist)
      values (
        7 + i, 2, m.slug,
        titles[i],
        m.nome || ' — giorno ' || i || ' di 9',
        E'**Questo giorno del modulo "' || m.nome || E'" (' || m.tema || E') è in arrivo.**\n\n'
        || E'Il contenuto dettagliato di questo giorno è in fase di scrittura e comparirà qui automaticamente, senza che tu debba fare nulla.\n\n'
        || E'Nel frattempo: continua a ripassare le fondamenta della Fase 1 per 5 minuti al giorno — è il modo migliore di prepararti a questo modulo.',
        '["Ripasso di 5 minuti delle fondamenta (Fase 1)"]'
      );
    end loop;
  end loop;
end $$;
