// // src/filters/validation-exception.filter.ts
// import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
// import { Response } from 'express';

// @Catch(BadRequestException)
// export class ValidationExceptionFilter implements ExceptionFilter {
//   catch(exception: BadRequestException, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();
//     const status = exception.getStatus();

//     response
//       .status(status)
//       .json({
//         statusCode: status,
//         message: 'Validation failed',
//         errors: exception.getResponse()['message'],
//       });
//   }
// }


import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { ValidationError } from 'class-validator';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    if (exception.getResponse() instanceof Object && Array.isArray((exception.getResponse() as any).message)) {
      const validationErrors = (exception.getResponse() as any).message as ValidationError[];
      response
        .status(status)
        .json({
          statusCode: status,
          message: 'Validation failed',
          errors: this.formatErrors(validationErrors),
        });
    } else {
      response
        .status(status)
        .json(exception.getResponse());
    }
  }

  private formatErrors(errors: ValidationError[]) {
    return errors.reduce((acc, err) => {
      acc[err.property] = Object.values(err.constraints);
      return acc;
    }, {});
  }
}