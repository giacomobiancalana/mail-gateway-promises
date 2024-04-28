import * as dotenv from 'dotenv';
dotenv.config();

import { ENV } from './env'; // DEVE RIMANERE IN PRIMA POSIZIONE !!  
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle(ENV.APPNAME)
    .setDescription(`${ENV.APPNAME} reference API`)
    .addApiKey({
      type: 'apiKey',
      name: 'APIKEY',
      description: 'enter api-key',
      in: 'header',
    }, 'APIKEY-MAIL-GTW')  //TODO: da vedere se va bene
    .setVersion(ENV.VERSION)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/swagger', app, document , { swaggerOptions: { persistAuthorization: true}});


  await app.listen(ENV.PORT);
}
bootstrap();
