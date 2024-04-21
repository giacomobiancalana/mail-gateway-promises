import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const TENANT_ID = process.env.TENANT_ID;

export async function getObjWithAccessTokenData() {
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

    // console.log("obj_with_access_token.data:", obj_with_access_token.data);
    return await obj_with_access_token.data;
  } catch (error) {
    console.log(`Errore nel recuperare l'access token con lo scope ${scope}, ecco l'errore:\n`, error);
    return null;
  };
}
