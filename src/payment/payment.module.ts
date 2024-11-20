import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { StripeModule } from './stripe/stripe.module';
import { ScheduleModule } from '@nestjs/schedule';
import { StripeService } from 'src/stripe/application/stripe.service';
import { PaymentService } from './application/payment.service'

@Module({
  imports: [
    StripeModule.forRootAsync(),
    DatabaseModule, 
    ScheduleModule.forRoot()
  ],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    StripeService],
})
export class PaymentModule {}