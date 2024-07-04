import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: '*' });
  const port = process.env.PORT || 3000; // Use the PORT environment variable or default to 3000

  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);

  // console.log('Application is running on: http://localhost:3000');

}
bootstrap();


