import { Module } from '@nestjs/common';
import { StripeService } from 'src/stripe/application/stripe.service';
import { OrderService } from 'src/shared/application/order.service';
import { AccountService } from 'src/shared/application/account.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StripeModule } from 'src/stripe/stripe.module';
import { AccountController } from './infrastructure/account.controller';

@Module({
  controllers: [AccountController],
  providers: [
    OrderService,
    AccountService,
  ],
  exports: [
    OrderService,
    AccountService,
  ]
})
export class OperationsModule {}