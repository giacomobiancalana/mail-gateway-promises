import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const TENANT_ID = process.env.TENANT_ID;

@Injectable()
export class TokenService {

  async getObjWithAccessTokenData() {
    const scope = "https://outlook.office365.com/.default";
    try {
      const objWithAccessToken: AxiosResponse = await axios.request({
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
  
      // console.log("obj_with_access_token:", objWithAccessToken);
      // campo data di objWithAccessToken è : {
      // token_type: 'Bearer',
      // expires_in: 3599,
      // ext_expires_in: 3599,
      // access_token: <string>
      // }

      return await objWithAccessToken.data;
    } catch (error) {
      throw new Error(`Errore nel recuperare l'access token con lo scope ${scope}, ecco l'errore:\n${error}`);
    };
  }

}
