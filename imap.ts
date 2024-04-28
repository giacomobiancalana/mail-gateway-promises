import { FetchMessageObject, FetchQueryObject, ImapFlow, ImapFlowOptions, MailboxLockObject, SearchObject } from 'imapflow';
import path = require('path');
import * as dotenv from 'dotenv';
dotenv.config();
import { getObjWithAccessTokenData } from './tokenGenerator';
import util from 'util';
import { ParsedMail, simpleParser } from 'mailparser';  //TODO: lo provi MailParser (al posto di simpleParser)?

const MONITORED_MAIL = process.env.MONITORED_MAIL;

const imapFlowOpt: ImapFlowOptions = {
  host: 'outlook.office365.com',
  port: 993,
  secure: true,
  auth: {
    user: MONITORED_MAIL,
  },
  logger: false,
};

const client: ImapFlow = new ImapFlow(imapFlowOpt);

/** Funzione principale */
async function main() {
  const acc = await getObjWithAccessTokenData();
  //TODO: NestJS con Cron job,
  //TODO: poi, access token lo posso mettere come variabile di classe, e lo riprendo ogni volta fino alla scadenza (un'ora)? Come ragiono?
  const accessToken = acc?.access_token;
  if (!accessToken) {
    throw new Error('Access token non è stato inviato.');
  };

  imapFlowOpt.auth.accessToken = accessToken;

  // Wait until client connects and authorizes
  console.log("MI PREPARO ALLA CONNESSIONE!!");
  try {
    await client.connect();
  } catch (error) {
    throw new Error(`Niente connessione, ecco errore:\n${error}`);
  }
  console.log("CONNESSO!!");

  // Select and lock a mailbox. Throws if mailbox does not exist
  let lock: MailboxLockObject = await client.getMailboxLock('INBOX');
  try {
    if (client.mailbox === true || client.mailbox === false) {
      throw new Error("CLIENT.MAILBOX IS A BOOLEAN, I DON'T KNOW WHY");
    }  // Ora so che client.mailbox è di tipo MailboxObject

    // "exists" value is also the largest sequence number available in the mailbox. Può essere usato anche nei fetch come sequence number
    console.log("Number of messages in this mailbox:", client.mailbox.exists)

    // SEARCHING
    // Sequence numbers search
    const searchObj: SearchObject = {
      seen: false,
      since: '2024-04-01',
      or: [
        {
          to: 'dev.service+test@eagleprojects.it',
        },
        {
          to: 'dev.service+prova@eagleprojects.it',
        }
      ]
    };
    //TODO: da capire meglio l'or sul SearchObject, perché per ora non funziona o non sono riuscito a capire come funziona
    // Vedi in: node_modules/imapflow/lib/search-compiler.js
    // C'è un problema di base nella notazione Polish dell'Imap, o comunque la libreria imapflow non consente query troppo complicate
    // Comunque possiamo fare la ricerca anche solo per data e se è stata letta la mail oppure no, non c'è bisogno di farla per destinatario

    // const messagesNumbers = await client.search(searchObj);
    // In realtà client.search può ritornare anche false, se il searchObject non è creato bene (or con almeno un oggetto vuoto)
    // console.log("messages seq numbers:\n", messagesNumbers);
    // Uid search
    const messagesNumbersUids = await client.search(searchObj, { uid: true });
    console.log("messages UIDS:\n", messagesNumbersUids);

    // FETCHING
    const fetchQueryObj: FetchQueryObject = {
      source: true,
      uid: true,
      envelope: true,
      flags: true,
      bodyStructure: true,
      internalDate: true,
      size: true,
      threadId: true,
      labels: true,
      headers: true,
      // bodyParts: // must be an array of string
    };

    // Logging the fetched messages
    for await (let mess of client.fetch(messagesNumbersUids, fetchQueryObj, { uid: true })) {
      console.log("mess:\n", util.inspect(mess, { showHidden: true, depth: null, colors: true }));
      // console.log("source:", mess.source.toString()); // -> per vedere la mail con tutti i campi, da Buffer a stringa, non parsata da MailParser però 
      // console.log("---------------------------------");
      const parsedMail: ParsedMail = await simpleParser(mess.source);
      const { headerLines, headers, html, /*textAsHtml, text,*/ ...parsedMailWithNoHeaders } = parsedMail;
      console.log("#################################");
      console.log("MAIL PARSATA:\n")
      console.log(util.inspect(parsedMailWithNoHeaders, { showHidden: true, depth: null, colors: true }));
      // console.log(util.inspect({ to: parsedMail.to, from: parsedMail.from, subject: parsedMail.subject }, { showHidden: true, depth: null, colors: true }));
    }

    // const yy: AsyncGenerator<FetchMessageObject, never, void> = client.fetch('1:*', { envelope: true });
    //TODO: da capire: yy.return() o next() o throw(), e ancora: è un async generator (vedi il "for await" anche sopra), cosa sarebbe?

  } catch (err) {
    throw err;
  } finally {
    // Make sure lock is released, otherwise the next `getMailboxLock()` never returns
    lock.release();
  }

  // Log out and close connection
  await client.logout();
  console.log("LOGOUT EFFETTUATO");
};

// Chiamata alla funzione principale
try {
  main();
} catch (error) {
  console.error(error);
}
