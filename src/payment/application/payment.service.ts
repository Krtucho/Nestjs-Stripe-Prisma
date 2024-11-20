import { Injectable } from "@nestjs/common";

@Injectable()
export class PaymentService {
     // Crear Payment y generar URL suministrandole un companyId
     async createPayment(
        createPaymentDTO: CreatePaymentDTO,
        request
    ): Promise<Stripe.Response<Stripe.Checkout.Session>> {
        const actualDate: Date = new Date() // Fecha de hoy
        const date: Date = new Date() // Fecha limite para realizar el pago
        date.setDate(actualDate.getDate() + 7) // Fecha + siete dias a partir de hoy

        // Verifico si existe payment con esta orden, en caso de existir termino aqui
        const productsOrders = await this.databaseService.payment.findFirst({
            where:
            {
                orderId: createPaymentDTO.orderId
            }
        })
        if (productsOrders)
            throw new HttpException('El recurso no fue encontrado', HttpStatus.BAD_REQUEST);

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
}