import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { Payment, PaymentMethodType, PaymentStatus, Prisma, TransactionType } from '@prisma/client';
import { DatabaseService } from 'src/database/application/database.service';
import { CreatePaymentDTO } from '../domain/create-payment.dto';
import { Cron, CronExpression } from '@nestjs/schedule';


@Injectable()
export class StripeService {
    private stripe: Stripe;
    private secret: string;

    constructor(
        @Inject('STRIPE_API_KEY') private readonly apiKey: string,
        @Inject('STRIPE_WEBHOOK_SECRET') private readonly endpointSecret: string,
        @Inject('STRIPE_USER_ACCOUNT') private readonly userAccount: string,

        private readonly databaseService: DatabaseService
    ) {
        this.stripe = new Stripe(apiKey, { apiVersion: '2024-10-28.acacia' }); // Stripe connection
        this.secret = endpointSecret; // webhookSecret, se genera al reenviar los eventos a nuestra api
        this.userAccount = userAccount;
    }

    // Metodos para crear account, company y order en la base de datos, para ir probando
    async createAccount(createAccountDto: Prisma.AccountCreateInput) {
        return this.databaseService.account.create({ data: createAccountDto });
    }
    async createCompany(createCompanyDto: Prisma.CompanyCreateInput) {
        return this.databaseService.company.create({ data: createCompanyDto });
    }
    async createOrder(createOrderDto: Prisma.OrderCreateInput) {
        return this.databaseService.order.create({ data: createOrderDto });
    }

    // Crear Payment y generar URL suministrandole un companyId
    async createPayment(
        testPaymentDTO: CreatePaymentDTO,
        request
    ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
        const actualDate: Date = new Date() // Fecha de hoy
        const date: Date = new Date() // Fecha limite para realizar el pago
        date.setDate(actualDate.getDate() + 7) // Fecha + siete dias a partir de hoy

        // Genera un payment con valores por defecto y fecha limite de pago hasta dentro de siete dias a partir de hoy
        const payment = await this.databaseService.payment.create({
            data: {
                amount: 100,
                finalAmount: 100,
                paymentDate: actualDate,
                depositDate: date,
                companyId: 1,
            },
        });

        // Crear el PaymentMethod
        const paymentMethod = await this.databaseService.paymentMethod.create({
            data: {
                name: `Método de pago personalizado para ${payment.id}`,
                type: PaymentMethodType.WEEKLY, // O cualquier otro tipo que necesites
                date: actualDate,
                discountPercentage: 0, // Ajusta según sea necesario
                paymentId: payment.id,
            },
        });

        // Crear el Order relacionado con el Payment
        const order = await this.databaseService.order.create({
            data: {
                price: 50,
            },
        });

        // Actualiza el payment creado para que sepa que orden(Order) le corresponde
        await this.databaseService.payment.update({
            where: { id: payment.id },
            data: {
                orderId: order.id,
            },
        });

        // console.log(payment)
        // console.log(paymentMethod)
        // console.log(order)


        return await this.createStripePaymentUrl(payment, paymentMethod)// Genera la url de pago
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

        const account: Prisma.AccountCreateInput = {
            // "id": 1,
            bankCard: "1234-4567-8799-4948",
            stripeId: session.id,
            totalAmount: 100,
            // "paymentId": 1,
            accountType: TransactionType.INCOME
        } // Creando account de cliente relacionada con la url de pago

        await this.databaseService.account.create({
            data: account
        })

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

                    //Actualizo el Payment en bd con la informacion pasada en metadata cuando cree la url con el metodo createStripePaymentUrl
                    const payment = await this.databaseService.payment.update({
                        where: { id: +event.data.object.metadata.paymentId },
                        data: {
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

    // Tarea que se ejecutara una vez al dia, por el momento tiene puesto que se ejecute al medio dia (Descomentar segunda linea con @Cron(...) )
    // @Cron('45 * * * * *') // Para probar en cada segundo 45 de cada minuto
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Para probar el codigo real
    async checkPayments() : Promise<void>{
        console.log("Checking Payment")
        const begDate: Date = new Date() //  Fecha de hoy a las 00:00
        const endDate: Date = new Date() // Fecha de hoy a las 23:59
        // Fecha a las 00:00 del día actual
        begDate.setHours(0, 0, 0, 0);
        // Fecha a las 23:59 del día actual
        endDate.setHours(23, 59, 59, 999);

        const closedPayments = await this.databaseService.payment.findMany({ // Busca los payments que tengan como fecha limite de pago el dia de hoy y ya hayan sido pagados por el usuario
            where: {
                status: PaymentStatus.COMPLETED,
                depositDate: {
                    lte: endDate,
                    gte: begDate,
                },
            }
        });
        console.log(closedPayments);

        (await closedPayments).forEach(payment => this.applyDiscount(payment))// Aplica el descuento a cada payment encontrado
    }

    async applyDiscount(payment: Payment) { // Aplica un descuento a un Payment, si contiene multiples porcentajes de descuentos se suman todos y se le devuelve ese dinero al usuario
        console.log(payment)
        // Buscando PaymentMethods
        const paymentMethods = this.databaseService.paymentMethod.findMany({
            where: {
                paymentId: payment.id,
            }
        });
        console.log(paymentMethods)
        let totalDiscount: number = 0; // Porcentaje del descuento(Luego se convierte en dinero total que hay que devolverle al cliente)

        // Calcular el total del descuento
        (await paymentMethods).forEach(paymentMethod => {
            totalDiscount += paymentMethod.discountPercentage;
        });

        // Calcular el monto final
        const finalAmount: number = payment.amount * (1 - totalDiscount / 100);

        // Calcular el dinero a devolver
        const moneyToReturn: number = finalAmount > payment.amount ? payment.amount : payment.amount - finalAmount;

        console.log(`Monto final: $${finalAmount.toFixed(2)}`);
        console.log(`Dinero a devolver: $${moneyToReturn.toFixed(2)}`);

        // if (moneyToReturn)
        await this.sendMoneyToUser(this.userAccount, moneyToReturn)

        return moneyToReturn;
    }

    // No puedo probar esto de enviar dinero desde mi cuenta hacia otra porque al parecer necesito tener la cuenta activada, actualmente hice las pruebas con una cuenta de test
    async sendMoneyToUser(userId: string, amount: number) {
        try {
            // Obtenemos la cuenta conectada
            const connectedAccount = await this.stripe.accounts.retrieve(userId);

            // Creamos el pago
            const payment = await this.stripe.transfers.create({
                amount: amount * 100, // Convertimos a centavos
                currency: 'usd',
                destination: connectedAccount.default_currency == 'usd' ? 'default_for_currency' : null,
                description: 'Pago de prueba',
            });

            console.log('Pago creado:', payment);
            return true;
        } catch (error) {
            console.error('Error al enviar el pago:', error);
            return false;
        }
    }

    // Ejemplo de uso
    //   sendMoneyToUser('acct_1234567890', 100).then(result => {
    //     if (result) {
    //       console.log('El pago se ha enviado correctamente');
    //     } else {
    //       console.log('Hubo un error al enviar el pago');
    //     }
    //   });
}