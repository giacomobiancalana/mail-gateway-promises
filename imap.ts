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
  if (!acc) {
    throw new Error('Access token nullo.');
  };

  imapFlowOpt.auth.accessToken = acc.access_token;

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
      seen: true,
      since: '2024-04-01',
      to: 'dev.service+dev@eagleprojects.it',
      from: 'gbiancalana@eagleprojects.it',
      or: [{ from: 'biancalanagiacomo@outlook.it', to: 'dev.service+dev@eagleprojects.it', seen: true, since: '2024-04-01' }, {}]
    };  //TODO: da capire meglio l'or sul SearchObject
    const messagesNumbers = await client.search(searchObj);
    console.log("messages seq numbers:\n", messagesNumbers);
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
      console.log("---------------------------------");
      const parsedMail: ParsedMail = await simpleParser(mess.source);
      const { headerLines, headers, ...parsedMailWithNoHeaders } = parsedMail;
      console.log("MAIL PARSATA:\n")
      console.log(util.inspect(parsedMailWithNoHeaders, { showHidden: true, depth: null, colors: true }));
      console.log("#################################");
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
