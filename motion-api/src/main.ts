import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module.js';
import { fixNullableTypes } from './common/openapi/fix-nullable-types.js'; // new

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Motion API')
    .setDescription('Backend of the Motion multisport app')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const rawDoc = SwaggerModule.createDocument(app, config);
  fixNullableTypes(rawDoc);                                  
  const openApiDoc = cleanupOpenApiDoc(rawDoc);            

  app.use('/docs', apiReference({ content: openApiDoc }));

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();