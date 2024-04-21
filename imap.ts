import { ImapFlow, ImapFlowOptions, MailboxLockObject } from 'imapflow';
import path = require('path');
import * as dotenv from 'dotenv';
dotenv.config();
import { getObjWithAccessTokenData } from './tokenGenerator';

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
  if (!acc) {
    throw new Error('Access token nullo.');
  };

  imapFlowOpt.auth.accessToken = acc.access_token;

  // Wait until client connects and authorizes
  console.log("MI PREPARO ALLA CONNESSIONE!!");
  try {
    await client.connect();
  } catch (error) {
    console.error("Niente connessione, errore:\n", error);
    return;
  }
  console.log("CONNESSO!!")

  // Select and lock a mailbox. Throws if mailbox does not exist
  let lock: MailboxLockObject = await client.getMailboxLock('INBOX');
  try {
    // fetch latest message source
    // client.mailbox includes information about currently selected mailbox
    // "exists" value is also the largest sequence number available in the mailbox
    if (typeof client.mailbox !== 'boolean') {
      
      // exists property
      console.log("client.mailbox.exists:", client.mailbox.exists);
      
      // fetchOne method e source
      let message = await client.fetchOne(`${client.mailbox.exists}`, { source: true });
      console.log("message.source:", message.source.toString());

      // Uid and sequence numbers search
      const messagesNumbers = await client.search({seen: true, to: 'dev.service+dev@eagleprojects.it'});  // , {uid: true}
      console.log("messages:\n", messagesNumbers);
      const messagesNumbersUids = await client.search({seen: true, to: 'dev.service+dev@eagleprojects.it'}, {uid: true});
      console.log("messages UIDS:\n", messagesNumbersUids);

      // FetchOne con search soprastante
      const messageNumb = messagesNumbers[0];
      console.log("messageNumb:", messageNumb);
      const mess = await client.fetchOne(`${messageNumb}`, {source: true});
      //TODO: forse con { uid: true } va a cercare con l'uid invece che con il sequenceNumber (ecco forse perché non funzionava)
      console.log("mess da fetchare:\n", mess.source.toString());
      
      // list subjects for all messages
      // uid value is always included in FETCH response, envelope strings are in unicode.
      const yy = client.fetch('1:*', { envelope: true });
      //TODO: da capire: yy.return; o next() o throw(), e ancora: è un async generator (vedi sotto il "for await")
      for await (let message of client.fetch('1:*', { envelope: true })) {
        //TODO: adesso li scandaglia tutti i messaggi, come mai prima non lo faceva??
        console.log("message uid e altro:\n", `${message.uid}: ${message.envelope.subject}`);
      }
    }
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
main().catch(err => console.error(err));
