
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StripeController } from './infrastructure/stripe.controller';
import { StripeService } from './application/stripe.service';

@Module({})
export class StripeModule {

  static forRootAsync(): DynamicModule {
    return {
      module: StripeModule,
      controllers: [StripeController],
      imports: [ConfigModule.forRoot()],
      providers: [
        StripeService,
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
    };
  }
}
