import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const corsOptions =
  process.env.NODE_ENV === 'production'
    ? { origin: 'https://localhost:4000', credentials: true }
    : { origin: '*' };

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(corsOptions);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
