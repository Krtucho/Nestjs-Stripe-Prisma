import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { Payment, PaymentMethod, PaymentMethodType, PaymentStatus, Prisma, TransactionType } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';
import { TestPaymentDTO } from './dto/test-payment.dto';
import { DefaultArgs } from '@prisma/client/runtime/library';
import { Cron, CronExpression } from '@nestjs/schedule';


@Injectable()
export class StripeService {
    private stripe: Stripe;
    private secret: string;
    private readonly logger = new Logger("StripeService");


    constructor(
        @Inject('STRIPE_API_KEY') private readonly apiKey: string,
        @Inject('STRIPE_WEBHOOK_SECRET') private readonly endpointSecret: string,
        private readonly databaseService: DatabaseService
    ) {
        this.stripe = new Stripe(apiKey, { apiVersion: '2024-10-28.acacia' });
        this.secret = endpointSecret;
    }

    async createCustomer(email: string, name: string) {
        return this.stripe.customers.create({
            email,
            source: 'cus_1234567890',
            name,
        });
    }

    async createPaymentIntent(amount: number, currency: string) {
        return this.stripe.paymentIntents.create({
            amount,
            currency,
            payment_method_types: ['card'],
        });
    }

    async createAccount(createAccountDto: Prisma.AccountCreateInput) {
        return this.databaseService.account.create({ data: createAccountDto });
    }
    async createCompany(createCompanyDto: Prisma.CompanyCreateInput) {
        return this.databaseService.company.create({ data: createCompanyDto });
    }

    getDomain(domainName): Prisma.AccountDelegate<DefaultArgs> | Prisma.CompanyDelegate | Prisma.PaymentDelegate {
        switch (domainName) {
            case "account":
                return this.databaseService.account
            case "company":
                return this.databaseService.company
            case "payment":
                return this.databaseService.payment
        }
    }
    async createOrder(createOrderDto: Prisma.OrderCreateInput) {
        return this.databaseService.order.create({ data: createOrderDto });
    }

    async createPayment(
        testPaymentDTO: TestPaymentDTO,
        request
    ) {
        const actualDate = new Date()
        const date = new Date()
        date.setDate(actualDate.getDate() + 7)

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

        await this.databaseService.payment.update({
            where: { id: payment.id },
            data: {
                orderId: order.id,
            },
        });



        console.log(payment)
        console.log(paymentMethod)
        console.log(order)


        return await this.createStripePaymentUrl(payment, paymentMethod)
        // const company: Prisma.CompanyCreateNestedOneWithoutPaymentsInput = await this.databaseService.company.findUnique({
        //     where:
        //     {
        //         id: testPaymentDTO.companyId as number
        //     }
        // })

        // // Guardar Payment con PaymentMethod de una semana en bd
        // const account: Prisma.AccountCreateNestedManyWithoutPaymentInput = {
        //     // "id": 1,
        //     "bankCard": "1234-4567-8799-4948",
        //     "stripeId": "123154646",
        //     "totalAmount": 100,
        //     // "paymentId": 1,
        //     "accountType": "INCOME"//TransactionType.DEPOSIT
        // }
        // // Cargo una orden guardada en la bd
        // const order = await this.databaseService.order.findUnique({
        //         where: {
        //           id: 1,
        //         },
        //         include: {
        //           payment: true
        //         }
        //       });



        // const payment: Prisma.PaymentCreateWithoutPaymentMethodsInput = {
        //     "amount": 100,
        //     "finalAmount": 100,
        //     "paymentDate": actualDate,
        //     "depositDate": date, // Fecha actual mas 7 dias
        //     // "paymentMethods": [],
        //     // "companyId": testPaymentDTO.companyId,
        //     "company": company,
        //     "account": account,
        //     // "orderId": order.id,
        //     // "order": order
        // }

        // const paymentMethod: Prisma.PaymentMethodCreateInput = {
        //     "name": "Weekly Payment",
        //     "type": PaymentMethodType.WEEKLY,
        //     "date": date,
        //     "discountPercentage": 0,
        //     "payment":
        //     {
        //         "create": payment
        //             // {

        //             //     "content": {payment}
        //             // }

        //     } 
        // }

        // const cratedPaymentMethod = await this.databaseService.paymentMethod.create({ 
        //     data: paymentMethod
        // })
        // console.log(cratedPaymentMethod)

        // this.databaseService.payment.update({
        //         where: {
        //           id: cratedPaymentMethod.paymentId,
        //         },
        //         data: {

        //                 "paymentMethods": [cratedPaymentMethod]

        //         },
        //       });

        // const createdPayment = await this.databaseService.payment.create({
        //     data: payment
        // })
    }

    async createStripePaymentUrl(payment, paymentMethod) {
        const session =
            // await stripe.
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
                    company: payment.companyId,
                    payment: payment.id
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
        }

        await this.databaseService.account.create({
            data: account
        })
    }

    async testPayment(
        testPaymentDTO: TestPaymentDTO,
        request
    ) {
        // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        // const body = await request.json();

        const url = request.url.split('/');
        const domainName = url[url.length - 1];
        // const domain = this.getDomain(domainName)

        // Obteniendo Account
        // const account = await this.databaseService.account.findUnique(
        //     {
        //         where:
        //         {
        //             id: testPaymentDTO.accountId
        //         }
        //     }
        // )
        const account = {
            "id": 1,
            "bankCard": "1234-4567-8799-4948",
            "stripeId": "123154646",
            "totalAmount": 100,
            "paymentId": 1,
            "accountType": "INCOME"//TransactionType.DEPOSIT
        }
        //this.getDomain('account').findUnique({where: {testPaymentDTO.accountId}})
        const company = await this.databaseService.company.findUnique({
            where:
            {
                id: testPaymentDTO.companyId as number
            }
        }
        )
        //  this.getDomain('company').

        //await this.databaseService.domain.findUnique({ where: { name: domainName } });
        if (!account || !company) {
            console.log("Not exist!!");
            return;
        }

        const session =
            // await stripe.
            await this.stripe.checkout.sessions.create({
                success_url: `${process.env.DOMAIN_URL}/success`,
                line_items: [
                    {
                        price_data: {
                            currency: "usd",
                            product_data: {
                                name: account.accountType,
                            },
                            unit_amount: account.totalAmount,
                        },
                        quantity: 1,
                    },
                ],
                metadata: {
                    companyId: company.id,
                    paymentId: account.paymentId
                },
                mode: "payment",
                // expires_at: Math.floor(Date.now() / 1000) + 604800, // Una semana desde ahora en segundos
                //expires_at: Math.floor(Date.now() / 1000) + 2592000, // Un mes desde ahora en segundos
            });

        console.log(session)


    }
    async webhook(request, signature) {

        // const body = await request.text();
        // const sig = request.headers['stripe-signature'] || request.headers['x-stripe-signature'];

        // console.log(request)
        // console.log(signature)
        // console.log(this.secret)
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
        // return

        //   Manejar los diferentes tipos de eventos de webhook
        switch (event.type) {
            case 'checkout.session.completed':
                try {

                    //Actualizo el Payment en bd
                    await this.databaseService.payment.update({
                        where: { id: +event.data.object.metadata.paymentId },
                        data: {
                            status: PaymentStatus.COMPLETED
                        }
                    })
                    console.log("Pago completado")
                } catch (err) {
                    return err;
                }
                break;
            case 'customer.subscription.created':
                // Tratar evento de suscripción creada

                break;
            case 'invoice.payment_succeeded':
                const subscriptionItem = await this.stripe.subscriptions.retrieve(
                    event.data.object.subscription
                );
                // try {
                //     await this.invoicesService.create(subscriptionItem.plan.metadata.planId);
                // }
                // catch (err) {
                //     return err;
                // }
                break;
            case 'invoice.payment_failed':
                // Tratar evento de pago no exitoso
                break;
            case 'customer.subscription.deleted':
                // Tratar evento de suscripción cancelada o eliminada
                break;
            case 'customer.subscription.updated':
                // Tratar evento de suscripción actualizada, puede incluir cancelaciones
                break;
            // Agrega casos para otros eventos que te interesen
            default:
            //   return response.status(HttpStatus.OK).send();
        }
        // const subscription = await this.prismaService.subscription.findUnique({ where: { priceId } });
        // await this.prismaService.subscription.update({
        //     data: { active },
        //     where: { id: subscription.id }
        // })
    }
    @Cron('45 * * * * *')
    // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    checkPayments() {
        this.chekPayment()
        // this.logger.debug('Called when the current second is 45');
    }

    async chekPayment() {
        const closedPayments: Payment[] = await this.databaseService.payment.findMany({
            where: {
                status: PaymentStatus.COMPLETED,
            },
            // include: {
            //   description:true,
            //   tags: true,
            //   reviews: true
            // }
        });

        closedPayments.forEach(payment => this.applyDiscount(payment))

        // await this.applyDiscount()
    }

    async applyDiscount(payment: Payment) {
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
  const finalAmount = payment.amount * (1 - totalDiscount / 100);

  // Calcular el dinero a devolver
  const moneyToReturn = payment.amount - finalAmount;

  console.log(`Monto final: $${finalAmount.toFixed(2)}`);
  console.log(`Dinero a devolver: $${moneyToReturn.toFixed(2)}`);

  return moneyToReturn;
        // if(!payment.paymentMethods? && payment.paymentMethods?.length)
    }
}


// async webHook(request) {
//     // const url = request.url.split('/');
//     // const domainName = url[url.length - 1];
//     // const domain = await this.prisma.domain.findUnique({ where: { name: domainName } });
//     // if (!domain) {
//     //     console.log("Domain name not exist!!");
//     //     return;
//     // }
//     // const stripeSecretKey = domain.modeProductions ? domain.skPruebas : domain.sk;
//     // const endpointSecret = domain.webhooks;
//     const stripe = require('stripe')(stripeSecretKey);
//     let event;
//     const sig = request.headers['stripe-signature'];
//     try {
//         event = stripe.webhooks.constructEvent(request.rawBody, sig, endpointSecret);
//     } catch (err) {
//         throw new BadRequestException(`Webhook Error: ${err.message}`);
//     }
//     // Manejar los diferentes tipos de eventos de webhook
//     switch (event.type) {
//         case 'checkout.session.completed':
//             try {
//                 await this.prisma.subscription.update({
//                     where: { id: +event.data.object.metadata.subcripcionId },
//                     data: {
//                         active: true,
//                         subscriptionDate: new Date(),
//                         activationDate: new Date(),
//                         paymentStatus: PaymentStatus.COMPLETED
//                     }
//                 })
//             } catch (err) {
//                 return err;
//             }
//             break;
//         case 'customer.subscription.created':
//             // Tratar evento de suscripción creada
//             break;
//         case 'invoice.payment_succeeded':
//             const subscriptionItem = await stripe.subscriptions.retrieve(
//                 event.data.object.subscription
//             );
//             try {
//                 await this.invoicesService.create(subscriptionItem.plan.metadata.planId);
//             }
//             catch (err) {
//                 return err;
//             }
//             break;
//         case 'invoice.payment_failed':
//             // Tratar evento de pago no exitoso
//             break;
//         case 'customer.subscription.deleted':
//             // Tratar evento de suscripción cancelada o eliminada
//             break;
//         case 'customer.subscription.updated':
//             // Tratar evento de suscripción actualizada, puede incluir cancelaciones
//             break;
//         // Agrega casos para otros eventos que te interesen
//         default:
//         //   return response.status(HttpStatus.OK).send();
//     }
//     // const subscription = await this.prismaService.subscription.findUnique({ where: { priceId } });
//     // await this.prismaService.subscription.update({
//     //     data: { active },
//     //     where: { id: subscription.id }
//     // })
// }