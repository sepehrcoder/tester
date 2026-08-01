import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import type { OtpPurpose } from '../../generated/prisma/enums';

const OTP_TTL_MINUTES = 10;

/**
 * OTP delivery is mocked: the code is logged and (when OTP_MOCK_MODE=true)
 * returned in the API response so the flow is testable without a real SMS
 * provider. Swap `send()` for Twilio/etc. and flip OTP_MOCK_MODE=false
 * before going live — nothing else in the auth flow needs to change.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private get mockMode(): boolean {
    return this.config.get('OTP_MOCK_MODE', 'true') === 'true';
  }

  async generateAndSend(identifier: string, purpose: OtpPurpose) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

    await this.prisma.otpCode.create({
      data: { identifier, code, purpose, expiresAt },
    });

    await this.send(identifier, code);

    return {
      expiresAt,
      ...(this.mockMode ? { devCode: code } : {}),
    };
  }

  async verify(
    identifier: string,
    purpose: OtpPurpose,
    code: string,
  ): Promise<void> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { identifier, purpose, code, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || otp.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired code');
    }

    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumedAt: new Date() },
    });
  }

  private send(identifier: string, code: string): Promise<void> {
    // Mock provider — replace with a real SMS gateway for production.
    this.logger.log(`[MOCK SMS] OTP for ${identifier}: ${code}`);
    return Promise.resolve();
  }
}
