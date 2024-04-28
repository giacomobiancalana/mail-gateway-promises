import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { TokenService } from './token/token.service';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(public tokenService: TokenService) { }

  response: any;
  accessToken: string;

  async onApplicationBootstrap() {
    this.response = await this.main();
    this.accessToken = this.response["access_token"]
    console.log(this.accessToken);
  }

  async main() {
    const res = await this.tokenService.getObjWithAccessTokenData();
    return res;
  }

}
