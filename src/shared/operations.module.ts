import { Module } from '@nestjs/common';
import { OrderService } from 'src/shared/application/order.service';
import { AccountService } from 'src/shared/application/account.service';
import { AccountController } from './infrastructure/account.controller';
import { OrderController } from './infrastructure/order.controller';

@Module({
  controllers: [
    AccountController, 
    OrderController],
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