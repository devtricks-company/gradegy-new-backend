import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: '*',
    methods: '*',
    allowedHeaders: '*',
  });

  if (configService.get<boolean>('swagger.enabled', true)) {
    const swaggerDocumentConfig = new DocumentBuilder()
      .setTitle(configService.get<string>('swagger.title') ?? 'API')
      .setDescription(configService.get<string>('swagger.description') ?? '')
      .setVersion(configService.get<string>('swagger.version') ?? '1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, swaggerDocumentConfig);
    const swaggerPath = configService.get<string>('swagger.path') ?? 'docs';
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = configService.get<number>('PORT') ?? Number(process.env.PORT) ?? 5400;
  await app.listen(port);
  logger.log(`Application is running on port ${port}`);
}
bootstrap();
