import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const TENANT_ID = process.env.TENANT_ID;

@Injectable()
export class TokenService {

  data: object; //Record<string, any>;
  tsLastAccessToken: number;

  async getTokenDataObj() {
    //TODO: per TEST -> rendiamo nullo l'accessToken e/o, invece di aspettare un'ora, aggiungiamo secondi a tsLastAccessToken
    // (o magari aspettiamo comunque un'ora per l'invalidazione del token)
    if (!!this.data["accessToken"] && Date.now() > this.tsLastAccessToken * 1000) {
      return this.data;
    }

    const scope = "https://outlook.office365.com/.default";
    try {
      const res: AxiosResponse = await axios.request({
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
      //INFO: tipico campo "data" di res: { token_type: 'Bearer', expires_in: 3599, ext_expires_in: 3599, access_token: <string> }

      this.data = res.data;
      this.tsLastAccessToken = Date.now();
      return res.data;
    } catch (error) {
      throw new Error(`Errore nel recuperare l'access token con lo scope ${scope}, ecco l'errore:\n${error}`);
    };
  }

}
