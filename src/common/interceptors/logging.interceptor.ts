import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();

    const method = request?.method ?? 'UNKNOWN_METHOD';
    const url = request?.originalUrl ?? request?.url ?? context.getHandler().name;

    return next.handle().pipe(
      tap({
        next: () =>
          this.logger.log(`${method} ${url} ${Date.now() - now}ms`, context.getClass().name),
        error: (error: Error) =>
          this.logger.error(
            `${method} ${url} ${Date.now() - now}ms - ${error.message}`,
            error.stack,
            context.getClass().name,
          ),
      }),
    );
  }
}
