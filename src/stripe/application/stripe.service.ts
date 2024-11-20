import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentStatus } from '@prisma/client';
import { DatabaseService } from 'src/database/application/database.service';
import { AccountService } from 'src/shared/application/account.service';


@Injectable()
export class StripeService {
    private stripe: Stripe;
    private secret: string;
    
    constructor(
        @Inject('STRIPE_API_KEY') private readonly apiKey: string,
        @Inject('STRIPE_WEBHOOK_SECRET') private readonly endpointSecret: string,
        @Inject('STRIPE_USER_ACCOUNT') private readonly userAccount: string,
        
        private readonly databaseService: DatabaseService,
        private readonly accountService: AccountService
    ) {
        this.stripe = new Stripe(apiKey, { apiVersion: '2024-10-28.acacia' }); // Stripe connection
        this.secret = endpointSecret; // webhookSecret, se genera al reenviar los eventos a nuestra api
        this.userAccount = userAccount;
    }

    // Suministrar una Url de pago de Stripe para un payment con un paymentMethod creado
    async createStripePaymentUrl(payment, paymentMethod): Promise<Stripe.Response<Stripe.Checkout.Session>> {
        // Generando url de pago de strip, el id de la session generada se lo pasamos a account, que supongo que representaria al cliente(Account) y lo guardamos en la base de datos
        const session: Stripe.Response<Stripe.Checkout.Session> =
            await this.stripe.checkout.sessions.create({
                success_url: `${process.env.DOMAIN_URL}/success`,
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: paymentMethod.name,
                            },
                            unit_amount: payment.finalAmount,
                        },
                        quantity: 1,
                    },
                ],
                metadata: {
                    companyId: payment.companyId,
                    paymentId: payment.id
                },
                mode: "payment",
                // expires_at: Math.floor(Date.now() / 1000) + 604800, // Una semana desde ahora en segundos
                //expires_at: Math.floor(Date.now() / 1000) + 2592000, // Un mes desde ahora en segundos
            });

        console.log(session)

        await this.accountService.createAccountDefaultValues(payment, session)
        return session
    }
    
    async webhook(request, signature) {
        let event;

        try {
            event = this.stripe.webhooks.constructEvent(
                request.rawBody as Buffer,
                signature,
                this.secret);
        } catch (error) {
            console.log(error);
            throw new BadRequestException(`Webhook Error: ${error.message}`);
        }

        console.log(event)
        console.log(event.type)

        //   Manejar los diferentes tipos de eventos de webhook
        switch (event.type) {
            case 'checkout.session.completed':
                try {
                    // console.log(event.data.object.metadata)
                    // console.log(+event.data.object.metadata.paymentId)

                    const date = new Date()
                    //Actualizo el Payment en bd con la informacion pasada en metadata cuando cree la url con el metodo createStripePaymentUrl
                    const payment = await this.databaseService.payment.update({
                        where: { id: +event.data.object.metadata.paymentId },
                        data: {
                            receivedDate: date,
                            status: PaymentStatus.COMPLETED
                        }
                    })
                    console.log(payment)

                    console.log("Pago completado")
                } catch (err) {
                    return err;
                }
                break;
        }
    }

    
    async sendMoneyToAccount(destination: string, amount: number) {
        try {
            // Obtenemos la cuenta conectada
            // const connectedAccount = await this.stripe.accounts.retrieve(userId);

            // Creamos el pago
            // Via usando transfers (Esto es para transferir desde mi account de Stripe a las connected accounts)
            const payment = await this.stripe.transfers.create({
                amount: amount * 100, // Convertimos a centavos
                currency: 'usd',
                destination: destination,//connectedAccount.default_currency == 'usd' ? 'default_for_currency' : null,
                description: 'Pago de prueba',
            });

            // Via usando payout (Para transferir desde mi cuenta de account a alguna tarjeta o banco de prueba)
            // const payout = await this.stripe.payouts.create({
            //     amount: 5000, // Monto en centavos
            //     currency: 'usd',
            //     destination: 'DE89370400440532013000'// '000123456789', // Tarjeta o banco de prueba, cambiar este valor para probar
            // });

            console.log('Pago creado:', payment);
            return true;
        } catch (error) {
            console.error('Error al enviar el pago:', error);
            return false;
        }
    }
}