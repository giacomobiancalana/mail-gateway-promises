import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { TokenService } from './token/token.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AppService implements OnApplicationBootstrap {
  constructor(public tokenService: TokenService) { }

  response: any;
  accessToken: string;

  async onApplicationBootstrap() {
    this.response = await this.main();
    this.accessToken = this.response["access_token"]
    console.log("ACCESS TOKEN:\n", this.accessToken);
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async main() {
    const res = await this.tokenService.getTokenDataObj();
    console.log(res);
    return res;
  }

}
