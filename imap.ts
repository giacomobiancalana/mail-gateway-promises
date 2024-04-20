import { ImapFlow, ImapFlowOptions } from 'imapflow';
import axios from 'axios';
import * as dotenv from 'dotenv';
import path = require('path');
dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET =process.env.CLIENT_SECRET;
const TENANT_ID = process.env.TENANT_ID;

const imapFlowOpt: ImapFlowOptions = {
  host: 'outlook.office365.com',
  port: 993,
  secure: true,
  auth: {
    user: 'dev.service@eagleprojects.it',
  },
  logger: false,
};

async function getObjWithAccessTokenData() {
  const scope = "https://outlook.office365.com/.default";
  try {
    const obj_with_access_token = await axios.request({
      method: "POST",
      url: `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      data: {
        client_id: CLIENT_ID,
        scope: scope,
        client_secret: CLIENT_SECRET,
        grant_type: "client_credentials"
      }
    });

    return await obj_with_access_token.data;
  } catch (error) {
    console.log(`Errore nel recuperare l'access token con lo scope ${scope}, ecco l'errore:\n`, error);
    return null;
  };
}

const client = new ImapFlow(imapFlowOpt);

const main = async () => {
  const acc = await getObjWithAccessTokenData();
  if (!acc) {
    throw new Error('access token nullo.')
  };

  imapFlowOpt.auth.accessToken = acc.access_token;

  // Wait until client connects and authorizes
  console.log("MI PREPARO ALLA CONNESSIONE!!");
  await client.connect();  //Perché tutti questi log??
  console.log("CONNESSO!!")

  // Select and lock a mailbox. Throws if mailbox does not exist
  let lock = await client.getMailboxLock('INBOX');
  try {
      // fetch latest message source
      // client.mailbox includes information about currently selected mailbox
      // "exists" value is also the largest sequence number available in the mailbox
      if (typeof client.mailbox !== 'boolean') {
        let message = await client.fetchOne(`${client.mailbox.exists}`, { source: true });
        console.log("message.source:", message.source.toString());
        
        // list subjects for all messages
        // uid value is always included in FETCH response, envelope strings are in unicode.
        const yy = client.fetch('1:*', { envelope: true });  //TODO: perchè non è una funzione async??
        for await (let message of client.fetch('1:*', { envelope: true })) {
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

main().catch(err => console.error(err));
