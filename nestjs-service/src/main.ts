import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ValidationExceptionFilter } from './filters/validation-exception.filter';
import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    exceptionFactory: (errors) => new BadRequestException(errors),
  }));
  app.useGlobalFilters(new ValidationExceptionFilter());
  
  
  app.enableCors({ origin: '*' });
  const port = process.env.PORT || 3000; // Use the PORT environment variable or default to 3000

  // await app.listen(port);

  await app.listen(port, '0.0.0.0'); // Bind to all network interfaces

  console.log(`Application is running on: ${await app.getUrl()}`);

  // console.log('Application is running on: http://localhost:3000');

}
bootstrap();
