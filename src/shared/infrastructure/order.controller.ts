import {
    Controller,
    Post,
    Body
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrderService } from '../application/order.service';

@Controller('payment')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Post('create-order')
    async createOrder(@Body() createOrderDto: Prisma.OrderCreateInput): Promise<{
        id: number;
        price: number;
    }> {
        return this.orderService.createOrder(createOrderDto)
    }

}