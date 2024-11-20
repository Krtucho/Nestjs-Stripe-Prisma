import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { DatabaseService } from "src/database/application/database.service";

@Injectable()
export class OrderService {
    constructor(
        private readonly databaseService: DatabaseService,
    ) {
    }
    async createOrderWithPrice(price: number){
        console.log(this.databaseService.order)
        const order = await this.databaseService.order.create({
            data: {
                price,
            },
        });

        return order
    }
    // Metodos para crear account, company y order en la base de datos, para ir probando
    async createOrder(createOrderDto: Prisma.OrderCreateInput) {
        return this.databaseService.order.create({ data: createOrderDto });
    }
}