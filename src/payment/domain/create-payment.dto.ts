import { Prisma } from '@prisma/client';

export class CreatePaymentDTO {
    companyId: number;
    orderId: number;
    price: number;
}