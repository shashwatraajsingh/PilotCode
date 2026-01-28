import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SecurityMiddleware } from './common/security/security.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // SECURITY: Apply security headers middleware
  app.use(new SecurityMiddleware().use.bind(new SecurityMiddleware()));

  // SECURITY: Environment-aware CORS configuration
  const nodeEnv = process.env.NODE_ENV || 'development';
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

  app.enableCors({
    origin: nodeEnv === 'production'
      ? allowedOrigins // Only allow specified origins in production
      : true, // Allow all in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // SECURITY: Only enable Swagger API documentation in non-production environments
  if (nodeEnv !== 'production') {
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
  }

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
