import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Motion API')
    .setDescription('Backend of the Motion multisport app')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const openApiDoc = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));

  app.use('/docs', apiReference({ content: openApiDoc }));

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();