import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { DatabaseService } from "src/database/application/database.service";
import { StripeService } from "src/stripe/application/stripe.service";
import { CreatePaymentDTO } from "../domain/create-payment.dto";
import Stripe from "stripe";
import { Payment, PaymentMethodType, PaymentStatus } from "@prisma/client";
import { OrderService } from "src/shared/application/order.service";
import { Cron, CronExpression } from '@nestjs/schedule';
import { AccountService } from "src/shared/application/account.service";

@Injectable()
export class PaymentService {
    constructor(
        private readonly stripeService: StripeService,
        private readonly databaseService: DatabaseService,
        private readonly orderService: OrderService,
        private readonly accountService: AccountService
    ) {
    }
     // Crear Payment y generar URL suministrandole un companyId
     async createPayment(
        createPaymentDTO: CreatePaymentDTO,
        request
    ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
        const actualDate: Date = new Date() // Fecha de hoy
        const date: Date = new Date() // Fecha limite para realizar el pago
        date.setDate(actualDate.getDate() + 7) // Fecha + siete dias a partir de hoy

        // Verifico si existe payment con esta orden, en caso de existir termino devolviendo una excepcion
        const productsOrders = await this.databaseService.payment.findFirst({
            where:
            {
                orderId: createPaymentDTO.orderId
            }
        })

        console.log(productsOrders)
        if (productsOrders) // Devuelvo una excepcion en caso de haber encontrado algun payment con este Order
            throw new HttpException('La orden ya esta en uso', HttpStatus.BAD_REQUEST);

        // Genera un payment con valores por defecto y fecha limite de pago hasta dentro de siete dias a partir de hoy
        const payment = await this.databaseService.payment.create({
            data: {
                amount: createPaymentDTO.price,
                finalAmount: createPaymentDTO.price, // Se supone que esto venga en CreatePaymentDTO (Order price, pero estoy creando el order luego, ya luego decides cuando vas a crear o pasar order)
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
        const order = await this.orderService.createOrderWithPrice(createPaymentDTO.price)
       

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


        return await this.stripeService.createStripePaymentUrl(payment, paymentMethod)// Genera la url de pago
    }

    // Tarea que se ejecutara una vez al dia, por el momento tiene puesto que se ejecute al medio dia (Descomentar segunda linea con @Cron(...) )
    // @Cron('45 * * * * *') // Para probar en cada segundo 45 de cada minuto
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Para probar el codigo real
    async checkPayments(): Promise<void> {
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
        const account = await this.accountService.getAccountforPayment(payment.id)
        // Aqui actualizo la cuenta que pago (Cuenta del cliente)
        await this.accountService.updateAccount(account.id, {totalAmount: account.totalAmount+payment.finalAmount})
        await this.stripeService.sendMoneyToAccount(account.bankCard, moneyToReturn)

        return moneyToReturn;
    }
}