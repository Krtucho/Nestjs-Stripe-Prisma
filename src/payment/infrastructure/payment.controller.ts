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
  
  @Controller('stripe')
  export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}
  
    @Post('create-payment')
    async createPayment(
      @Body() body: CreatePaymentDTO, 
      @Req() request
      ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
      return this.paymentService.createPayment(body, request)
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
    @Get('customers')
    async getCustomers(){
      return await this.stripeService.getCustomers()
    }
  
    @Post('create-customer')
    async createCustomer(){
      return await this.stripeService.createCustomer()
    }
  
    @Post('fund-customer')
    async fundCustomer(){
      return await this.stripeService.fundCustomer()
    }
  
    @Get('balance')
    async getBalance(){
      return await this.stripeService.getBalance()
    }
  
    @Get('account')
    async getAccount(){
      return await this.stripeService.testAccount()
    }
  
    @Post('payout')
    async testPayout(){
      return await this.stripeService.testPayout()
    }
  
    @Get('charge')
    async testCharge(){
      return await this.stripeService.testCharges()//this.stripeService.createCharge('cus_RFbOdFvKKAi3gg',100, 'usd')
    }
  }