import { 
  Controller, 
  Post, 
  Body, 
  Req, 
  RawBodyRequest, 
  Headers, 
  HttpCode 
} from '@nestjs/common';
import { StripeService } from '../application/stripe.service';
import { CreatePaymentDTO } from '../domain/create-payment.dto';
import { Prisma, TransactionType } from '@prisma/client';
import Stripe from 'stripe';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-payment')
  async createPayment(
    @Body() body: CreatePaymentDTO, 
    @Req() request
    ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
    return this.stripeService.createPayment(body, request)
  }

  // Metodos para crear account, company y order en la base de datos, para ir probando
  @Post('create-account')
  async createAccount(@Body() createAccountDto: Prisma.AccountCreateInput): Promise<{
    id: number;
    paymentId: number;
    stripeId: string;
    totalAmount: number;
    bankCard: string;
    accountType: TransactionType;
}>{
    return this.stripeService.createAccount(createAccountDto)
  }
  @Post('create-company')
  async createCompany(@Body() createCompanyDto: Prisma.CompanyCreateInput):Promise<{
    id: number;
    name: string;
    bankCard: string;
}>{
    return this.stripeService.createCompany(createCompanyDto)
  }
  @Post('create-order')
  async createOrder(@Body() createOrderDto: Prisma.OrderCreateInput): Promise<{
    id: number;
    price: number;
}>{
    return this.stripeService.createOrder(createOrderDto)
  }

  // Stripe pide 3 cosas para la creacion de un evento enviado al webhook: body de la peticion en bruto(RawBody), signature: firma para comprobar que es la api a la cual se permitio y webhook_secret: este se pasa en el .env
  @HttpCode(200)
  @Post('webhook') // Redirigir webhooks de stripe a esta url
  async webhook( 
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
    ): Promise<void> {

    await this.stripeService.webhook(req, signature);
  }

  
}