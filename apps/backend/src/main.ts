import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger API documentation
  const config = new DocumentBuilder()
    .setTitle('Devin AI API')
    .setDescription('Autonomous Software Engineer API')
    .setVersion('1.0')
    .addTag('tasks', 'Task management')
    .addTag('executions', 'Code execution')
    .addTag('delivery', 'GitHub delivery')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app as any, config);
  SwaggerModule.setup('api', app as any, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`
  🚀 Devin AI Backend is running!
  
  📡 API: http://localhost:${port}
  📚 Docs: http://localhost:${port}/api
  🔌 WebSocket: ws://localhost:${port}
  
  Ready to build software autonomously! 🤖
  `);
}

bootstrap();
