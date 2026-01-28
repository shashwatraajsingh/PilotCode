import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get('JWT_SECRET');
        const nodeEnv = configService.get('NODE_ENV');

        // SECURITY: Prevent insecure defaults in production
        if (nodeEnv === 'production' && !jwtSecret) {
          throw new Error('CRITICAL: JWT_SECRET must be set in production environment');
        }

        // SECURITY: Warn in development about missing secret
        if (!jwtSecret) {
          console.warn('  WARNING: JWT_SECRET not set. Using insecure default for development only.');
        }

        return {
          secret: jwtSecret || 'dev-only-insecure-secret-do-not-use-in-production',
          signOptions: {
            expiresIn: configService.get('JWT_EXPIRES_IN') || '1h',
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule { }
