import { Module } from '@nestjs/common';
import { StripeService } from 'src/stripe/application/stripe.service';
import { PaymentService } from './application/payment.service'
import { PaymentController } from './infrastructure/payment.controller';
import { OrderService } from 'src/shared/application/order.service';
import { AccountService } from 'src/shared/application/account.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StripeModule } from 'src/stripe/stripe.module';
import { OperationsModule } from 'src/shared/operations.module';

@Module({
  controllers: [PaymentController],
  imports: [StripeModule, ConfigModule.forRoot(), OperationsModule],
  providers: [
    PaymentService,
    StripeService,
    OrderService,
    AccountService,
    {
      provide: 'STRIPE_API_KEY',
      useFactory: async (configService: ConfigService) =>
        configService.get('STRIPE_API_KEY'),
      inject: [ConfigService],
    },
    {
      provide: 'STRIPE_WEBHOOK_SECRET',
      useFactory: async (configService: ConfigService) =>
      configService.get('STRIPE_WEBHOOK_SECRET'),
      inject: [ConfigService],
    },
    {
      provide: 'STRIPE_USER_ACCOUNT',
      useFactory: async (configService: ConfigService) =>
      configService.get('STRIPE_USER_ACCOUNT'),
      inject: [ConfigService],
    }
  ],
})
export class PaymentModule {}