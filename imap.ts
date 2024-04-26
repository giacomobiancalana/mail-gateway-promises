import { FetchMessageObject, FetchQueryObject, ImapFlow, ImapFlowOptions, MailboxLockObject } from 'imapflow';
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
const main = async () => {
  //TODO: da dividere in più funzioni
  const acc = await getObjWithAccessTokenData();
  //TODO: se metto il cron job, access token lo posso mettere come variabile di classe, e lo riprendo ogni volta fino alla scadenza (un'ora)? Come ragiono?
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
    
    // "exists" value is also the largest sequence number available in the mailbox
    console.log("Number of messages in this mailbox:", client.mailbox.exists);
    
    // fetch latest message source

    // fetchOne method e source
    // let message = await client.fetchOne(`${client.mailbox.exists}`, { source: true });
    // console.log("message.source:", message.source.toString());


    // Sequence numbers search
    const messagesNumbers = await client.search({ seen: true, to: 'dev.service+dev@eagleprojects.it' });
    console.log("messages seq numbers:\n", messagesNumbers);
    // Uid search
    const messagesNumbersUids = await client.search({ seen: true, to: 'dev.service+dev@eagleprojects.it' }, { uid: true });
    console.log("messages UIDS:\n", messagesNumbersUids);
    for await (let mess of client.fetch(messagesNumbers, { source: true })) {
      //TODO: prova anche con opzione uid, passando uid o non facendolo
      console.log("mess:\n", util.inspect(mess, { showHidden: true, depth: null, colors: true }));
      console.log("source:", mess.source.toString());
      console.log("---------------------------------");
      const parsed = await simpleParser(mess.source);
      console.log("MAIL PARSATA:\n")
      console.log(parsed);
      console.log("#################################");
    }

    // FetchOne con search soprastante
    const messageNumb = messagesNumbers[0];
    console.log("messageNumb:", messageNumb);
    const mess: FetchMessageObject = await client.fetchOne(`${messageNumb}`, { source: true });
    console.log("mess da fetchare con Seq Number:\n", mess, 'Source:\n', mess.source.toString());

    // Ora fetchOne con uid
    const messageNumbUid = messagesNumbersUids[0];
    console.log("messageNumbUid:", messageNumbUid);
    let fetchQueryObj: FetchQueryObject = {
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
    const messWithUid: FetchMessageObject = await client.fetchOne(`${messageNumbUid}`, fetchQueryObj, { uid: true });
    //TODO: forse con { uid: true } va a cercare con l'uid invece che con il sequenceNumber (ecco forse perché non funzionava)
    console.log("mess da fetchare con UID:\n", messWithUid, '\n', 'SOURCE:\n', messWithUid.source.toString());
    
    // list subjects for all messages
    // uid value is always included in FETCH response, envelope strings are in unicode.
    // const yy = client.fetch('1:*', { envelope: true });
    //TODO: da capire: yy.return; o next() o throw(), e ancora: è un async generator (vedi sotto il "for await")

    // for await (let message of client.fetch('1:*', { envelope: true })) {
    //   //TODO: adesso li scandaglia tutti i messaggi, come mai prima non lo faceva??
    //   console.log("message uid e altro:\n", `${message.uid}: ${message.envelope.subject}`);
    // }

  } catch(err) {
    throw err;
  } finally {
      // Make sure lock is released, otherwise next `getMailboxLock()` never returns
      lock.release();
  }

  // log out and close connection
  await client.logout();
  console.log("LOGOUT EFFETTUATO");
};

// Chiamata alla funzione principale
//TODO: prima o poi ci va messo NestJS con i Cron Jobs

try {
  main();
} catch (error) {
  console.error(error);
}
