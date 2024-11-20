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
import { PaymentService } from '../application/payment.service';
  
  @Controller('payment')
  export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}
  
    @Post('create-payment')
    async createPayment(
      @Body() body: CreatePaymentDTO, 
      @Req() request
      ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
      return this.paymentService.createPayment(body, request)
    }
  }