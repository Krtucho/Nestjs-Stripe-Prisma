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
import { StripeService } from '../application/stripe.service';
import { CreatePaymentDTO } from '../../payment/domain/create-payment.dto';
import { Prisma, TransactionType } from '@prisma/client';
import Stripe from 'stripe';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  // Metodos para crear account, company y order en la base de datos, para ir probando
//   @Post('create-account')
//   async createAccount(@Body() createAccountDto: Prisma.AccountCreateInput): Promise<{
//     id: number;
//     paymentId: number;
//     stripeId: string;
//     totalAmount: number;
//     bankCard: string;
//     accountType: TransactionType;
// }>{
//     return this.stripeService.createAccount(createAccountDto)
//   }
//   @Post('create-company')
//   async createCompany(@Body() createCompanyDto: Prisma.CompanyCreateInput):Promise<{
//     id: number;
//     name: string;
//     bankCard: string;
// }>{
//     return this.stripeService.createCompany(createCompanyDto)
//   }

//   @Get('customers')
//   async getCustomers(){
//     return await this.stripeService.getCustomers()
//   }

//   @Post('create-customer')
//   async createCustomer(){
//     return await this.stripeService.createCustomer()
//   }

//   @Post('fund-customer')
//   async fundCustomer(){
//     return await this.stripeService.fundCustomer()
//   }

//   @Get('balance')
//   async getBalance(){
//     return await this.stripeService.getBalance()
//   }

//   @Get('account')
//   async getAccount(){
//     return await this.stripeService.testAccount()
//   }

//   @Post('payout')
//   async testPayout(){
//     return await this.stripeService.testPayout()
//   }

//   @Get('charge')
//   async testCharge(){
//     return await this.stripeService.testCharges()//this.stripeService.createCharge('cus_RFbOdFvKKAi3gg',100, 'usd')
//   }
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