import { 
  Controller, 
  Post, 
  Req, 
  RawBodyRequest, 
  Headers, 
  HttpCode, 
} from '@nestjs/common';
import { StripeService } from '../application/stripe.service';

@Controller('stripe')
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}
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