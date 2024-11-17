import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  // const app = await NestFactory.create(AppModule);

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,  // Retain raw request body for Stripe webhook verification
  });
  await app.listen(3000);
}
bootstrap();