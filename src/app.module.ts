import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TokenModule } from './token/token.module';
import { TokenService } from './token/token.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [TokenModule, ScheduleModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, TokenService],
})
export class AppModule {}
