import {
    Controller,
    Post,
    Body
} from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';
import { AccountService } from '../application/account.service';

@Controller('account')
export class AccountController {
    constructor(private readonly accountService: AccountService) { }

    // Metodos para crear account, company y order en la base de datos, para ir probando
    @Post('create-account')
    async createAccount(@Body() createAccountDto: Prisma.AccountCreateInput): Promise<{
        id: number;
        paymentId: number;
        stripeId: string;
        totalAmount: number;
        bankCard: string;
        accountType: TransactionType;
    }> {
        return this.accountService.createAccount(createAccountDto)
    }
}