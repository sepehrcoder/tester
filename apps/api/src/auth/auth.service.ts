import { randomBytes, createHash } from 'crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import ms from 'ms';
import { PrismaService } from '../prisma/prisma.service';
import { OtpService } from './otp.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthenticatedUser } from './types/authenticated-user';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly otp: OtpService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existing)
      throw new ConflictException(
        'An account with this phone number already exists',
      );

    if (dto.role === 'COMPANY' && !dto.companyName) {
      throw new BadRequestException(
        'companyName is required when registering as a company',
      );
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        ...(dto.role === 'DEALER' ? { dealerProfile: { create: {} } } : {}),
        ...(dto.role === 'COMPANY'
          ? { companyOwned: { create: { name: dto.companyName! } } }
          : {}),
      },
    });

    const otp = await this.otp.generateAndSend(user.phone, 'REGISTER');
    return {
      userId: user.id,
      otpExpiresAt: otp.expiresAt,
      ...(otp.devCode ? { devCode: otp.devCode } : {}),
    };
  }

  async verifyRegisterOtp(phone: string, code: string) {
    await this.otp.verify(phone, 'REGISTER', code);
    const user = await this.prisma.user.update({
      where: { phone },
      data: { phoneVerifiedAt: new Date() },
    });
    return this.issueTokenPair(user);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });
    if (!user)
      throw new UnauthorizedException('Invalid phone number or password');

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk)
      throw new UnauthorizedException('Invalid phone number or password');

    if (!user.phoneVerifiedAt)
      throw new UnauthorizedException('Phone number not verified yet');

    return this.issueTokenPair(user);
  }

  async requestLoginOtp(phone: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user)
      throw new BadRequestException('No account with this phone number');
    return this.otp.generateAndSend(phone, 'LOGIN');
  }

  async verifyLoginOtp(phone: string, code: string) {
    await this.otp.verify(phone, 'LOGIN', code);
    const user = await this.prisma.user.findUniqueOrThrow({ where: { phone } });
    if (!user.phoneVerifiedAt) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { phoneVerifiedAt: new Date() },
      });
    }
    return this.issueTokenPair(user);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: stored.userId },
    });
    return this.issueTokenPair(user);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async me(user: AuthenticatedUser) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { dealerProfile: true },
      omit: { passwordHash: true },
    });
  }

  private async issueTokenPair(user: { id: string; role: string }) {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_ACCESS_TTL',
          '15m',
        ) as ms.StringValue,
      },
    );

    const refreshToken = randomBytes(40).toString('hex');
    const refreshTtl = this.config.get<string>('JWT_REFRESH_TTL', '30d');

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + ms(refreshTtl as ms.StringValue)),
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
