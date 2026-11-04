import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const puerto = Number(process.env.PUERTO ?? 3010);
  await app.listen(puerto);
  console.log(`biblioteca-eventos escuchando en http://localhost:${puerto}`);
}
void bootstrap();
