
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StripeController } from './infrastructure/stripe.controller';
import { StripeService } from './application/stripe.service';
import { AccountService } from 'src/shared/application/account.service';
import { OperationsModule } from 'src/shared/operations.module';

@Module({})
export class StripeModule {

  static forRootAsync(): DynamicModule {
    return {
      module: StripeModule,
      controllers: [StripeController],
      imports: [ConfigModule.forRoot(), OperationsModule],
      providers: [
        StripeService,
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
      exports:[
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
      ]
    };
  }
}
