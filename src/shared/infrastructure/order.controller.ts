import { 
    Controller, 
    Post, 
    Body, 
    Req, 
    RawBodyRequest, 
    Headers, 
    HttpCode, 
    Get
  } from '@nestjs/common';
  import { CreatePaymentDTO } from '../../payment/domain/create-payment.dto';
  import { Prisma, TransactionType } from '@prisma/client';
  import Stripe from 'stripe';
import { OrderService } from '../application/order.service';
  
  @Controller('payment')
  export class PaymentController {
    constructor(private readonly orderService: OrderService) {}

@Post('create-order')
async createOrder(@Body() createOrderDto: Prisma.OrderCreateInput): Promise<{
  id: number;
  price: number;
}>{
  return this.orderService.createOrder(createOrderDto)
}

  }