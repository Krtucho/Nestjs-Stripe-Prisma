// @Public()
//   @Post("webhook/*") //Esto si la memoria no me fa'a es para capturar todo tipo de eventos de striper 
//   create(@Req() req: Request, @Body() body) {
//     return this.stripeService.webHook(req);
//   }
import { Controller, Post, Body, Req, RawBodyRequest, Headers, HttpCode, Request, Logger } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { TestPaymentDTO } from './dto/test-payment.dto';
import { Prisma } from '@prisma/client';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-customer')
  async createCustomer(@Body() body: { email: string, name: string }) {
    return this.stripeService.createCustomer(body.email, body.name);
  }

  @Post('create-payment-intent')
  async createPaymentIntent(@Body() body: { amount: number, currency: string }) {
    return this.stripeService.createPaymentIntent(body.amount, body.currency);
  }

  @Post('test-payment')
  async testPayment(@Body() body: TestPaymentDTO, @Req() request){
    return this.stripeService.createPayment(body, request)
    //this.stripeService.testPayment(body, request);
  }

  @Post('create-account')
  async createAccount(@Body() createAccountDto: Prisma.AccountCreateInput){
    return this.stripeService.createAccount(createAccountDto)
  }
  @Post('create-company')
  async createCompany(@Body() createCompanyDto: Prisma.CompanyCreateInput){
    return this.stripeService.createCompany(createCompanyDto)
  }
  @Post('create-order')
  async createOrder(@Body() createOrderDto: Prisma.OrderCreateInput){
    return this.stripeService.createOrder(createOrderDto)
  }
// create(@Body() createProductDto: Prisma.ProductCreateInput) {
  //   return this.productsService.create(createProductDto);
  // }

  @HttpCode(200)
  @Post('webhook')
  async webhook( 
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,): Promise<void> {
    // console.log("Inside Webhook")
    // console.log(req)
    // console.log("Event")
    await this.stripeService.webhook(req, signature);
    // return "OK"
  }

  
}