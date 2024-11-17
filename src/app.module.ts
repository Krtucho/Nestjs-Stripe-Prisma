import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { StripeModule } from './stripe/stripe.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    StripeModule.forRootAsync(),
    DatabaseModule, 
    ScheduleModule.forRoot()
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
