import { Injectable } from "@nestjs/common";
import { Prisma, TransactionType } from "@prisma/client";
import { DatabaseService } from "src/database/application/database.service";
import Stripe from "stripe";

@Injectable()
export class AccountService {
    constructor(
        private readonly databaseService: DatabaseService,
    ) {
    }
    // Metodos para crear account, company y order en la base de datos, para ir probando
    async createAccount(createAccountDto: Prisma.AccountCreateInput) {
        return this.databaseService.account.create({ data: createAccountDto });
    }

    async createAccountDefaultValues(payment, session: Stripe.Response<Stripe.Checkout.Session>) {
        const account: Prisma.AccountCreateInput = {
            // "id": 1,
            bankCard: "1234-4567-8799-4948",
            stripeId: session.id,
            totalAmount: 0,
            payment: payment,
            accountType: TransactionType.INCOME
        } // Creando account de cliente relacionada con la url de pago

        await this.databaseService.account.create({
            data: account
        })
    }

    async getAccountforPayment(id: number) {
        return await this.databaseService.account.findFirst({
            where: {
                id
            }
        })
    }

    async updateAccount(id: number, data: { totalAmount: number; }) {
        // Actualiza el account(mi account del cliente que pago) en la bd con la nueva cantidad de dinero que se transfirio
        // Le paso a la compannia la cantidad de dinero menos los impuestos
        // Update account in bd
        return await this.databaseService.account.update({
            where: {
                id
            },
            data
        })
    }
}