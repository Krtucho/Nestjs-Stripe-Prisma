# Proyecto de Pagos con devoluciones usando plataforma de Stripe y Nestjs con Prisma como backend

## Run

Para correrlo solamente cree el .env con los datos necesarios explicados en .env.copy

## Database

Carpeta database, para crear la conexion con servidor de Stripe

en: **prisma/schema.prisma** se encuentran los modelos, en caso de ser necesario aplicar migraciones con: (Buscar en la documentacion de prisma)
>npx prisma migrate dev --name init
>
## Stripe

### Controller

```typescript
// Metodos para crear account, company y order en la base de datos, para ir probando
@Post('create-account')
  async createAccount(@Body() createAccountDto: Prisma.AccountCreateInput)
@Post('create-company')
  async createCompany(@Body() createCompanyDto: Prisma.CompanyCreateInput)
@Post('create-order')
  async createOrder(@Body() createOrderDto: Prisma.OrderCreateInput)
```

#### Create payment

LLama al service, guarda un payment en la base de datos
y genera una url de pago

```typescript
@Post('create-payment')
  async createPayment(
    @Body() body: CreatePaymentDTO, 
    @Req() request
    )
```

#### Webhook

Recibe todos los eventos desde Stripe

```typescript
@HttpCode(200)
@Post('webhook') // Redirigir webhooks de stripe a esta url
  async webhook( 
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string,
    ): Promise<void>
```
### Service
Tarea que revisa cuales pagos se han realizado que tenian como fecha limite hoy para realizarse
```typescript
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Para probar el codigo real
    async checkPayments() : Promise<void>
```

#### Webhook
Quedandonos con evento de que el cliente ha pagado correctamente
```typescript
  switch (event.type) {
            case 'checkout.session.completed':
```

#### Create payment
Creacion de url de pago a partir de un payment y paymentMethod que se crea con diferente informacion
```typescript
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
```