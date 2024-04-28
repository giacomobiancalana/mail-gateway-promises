import * as dotenv from 'dotenv';
import path = require('path');
import { path as rootPath } from 'app-root-path';
import { CronExpression } from '@nestjs/schedule';
dotenv.config();

const FROM_TO_CC_AS_OBSERVERS: string[] = process.env.FROM_TO_CC_AS_OBSERVERS?.split(';') || [];

export abstract class ENV {
  static readonly VERSION = "1.0";
  static readonly APPNAME = "MAIL-GATEWAY";

  static readonly PORT = Number.parseInt(process.env.PORT || '3333');
  static readonly PORT_IMAP_SERVER = Number.parseInt(process.env.PORT_IMAP_SERVER || '993');
  static readonly HOST_IMAP_SERVER = process.env.HOST_IMAP_SERVER || "outlook.office365.com";
  static readonly USER_EMAIL = process.env.USER_MAIL || "dev.service@eagleprojects.it";
  static readonly CLIENT_ID = process.env.CLIENT_ID || "25e41d91-ea4f-4ccc-9f03-9dc8cc736ae2";
  static readonly CLIENT_SECRET = process.env.CLIENT_SECRET || "DfV8Q~u1WxviLzDnhZjyCbqNr6Vu5eDVV8-SQb1I";
  static readonly TENANT_ID = process.env.TENANT_ID || "8114c99b-4b65-4af8-b198-2eda6d543a76";
  static readonly MAIL_DOMAINS: string[] = process.env.MAIL_DOMAINS?.split(";").map((el) => el.trim()).filter((elem) => !!elem) || [];
  static readonly AVOID_THESE_USERS = process.env.AVOID_THESE_USERS?.split(";").map((el) => el.trim()).filter((elem) => !!elem) || [];
  // : -> sono le mail delle altre istanze del mail gateway e i relativi helpdesk.
  static readonly TIME_SEARCH_SINCE_PARAMETER = process.env.TIME_SEARCH_SINCE_PARAMETER || "2023-04-14";
  static readonly CRON_INTERVAL: string = process.env.CRON_INTERVAL || CronExpression.EVERY_30_SECONDS;
  static readonly MAIL_GTW_API_KEY: string = process.env.MAIL_GTW_API_KEY || "af0fd2df-1dc7-4227-a0f3-8fcd817de171";
  static readonly QUEUE_CASES: string = ["optimistic", "pessimistic"].includes(process.env.QUEUE_CASES) ? process.env.QUEUE_CASES : "optimistic";
  static readonly CHECK_ISSUE_ALREADY_IN_OM = process.env.CHECK_ISSUE_ALREADY_IN_OM === "false" ? false : true;

  static readonly CONFIG: string = path.join(rootPath, '/config.json');

  static readonly from_as_observer: boolean = FROM_TO_CC_AS_OBSERVERS.includes('from');
  static readonly to_as_observer: boolean = FROM_TO_CC_AS_OBSERVERS.includes('to');
  static readonly cc_as_observer: boolean = FROM_TO_CC_AS_OBSERVERS.includes('cc');
  //TODO: variabile d'ambiente per scegliere se tra effettuare autenticazione con password o con access token (in ognuno dei due
  // casi, deve essere presente la corrispondente variabile d'ambiente, cioè la password o l'access token)
}
console.log(ENV);
console.log("ROOT PATH: ", rootPath, '\n');
