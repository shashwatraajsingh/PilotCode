import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async login(user: any) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role || 'user',
    };

    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.generateRefreshToken(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(data: {
    email: string;
    password: string;
    name: string;
  }) {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new UnauthorizedException('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'USER',
      },
    });

    const { password, ...result } = user;
    return this.login(result);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException();
      }

      const { password, ...result } = user;
      return this.login(result);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });
  }

  async validateApiKey(apiKey: string): Promise<any> {
    // For BYOK (Bring Your Own Key) model
    // Validate against user's stored API keys
    const user = await this.prisma.user.findFirst({
      where: {
        apiKeys: {
          some: {
            key: apiKey,
            isActive: true,
          },
        },
      },
    });

    return user;
  }
}
