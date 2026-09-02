import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import { SMS_PROVIDER } from '../sms/sms-provider.interface';
import type { SmsProvider } from '../sms/sms-provider.interface';

const OTP_TTL_SECONDS = 120;
const OTP_RESEND_COOLDOWN_SECONDS = 60;
const OTP_MAX_ATTEMPTS = 5;
const REFRESH_TOKEN_TTL_DAYS = 30;

const otpKey = (phone: string) => `otp:${phone}`;
const otpCooldownKey = (phone: string) => `otp-cooldown:${phone}`;
const otpAttemptsKey = (phone: string) => `otp-attempts:${phone}`;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {}

  async requestOtp(phoneNumber: string): Promise<void> {
    const onCooldown = await this.redis.get(otpCooldownKey(phoneNumber));
    if (onCooldown) {
      throw new BadRequestException(
        'Please wait before requesting another code.',
      );
    }

    const code = this.generateCode();
    await this.redis.set(otpKey(phoneNumber), code, 'EX', OTP_TTL_SECONDS);
    await this.redis.set(
      otpCooldownKey(phoneNumber),
      '1',
      'EX',
      OTP_RESEND_COOLDOWN_SECONDS,
    );
    await this.redis.del(otpAttemptsKey(phoneNumber));

    await this.sms.sendOtp(phoneNumber, code);
  }

  async verifyOtp(phoneNumber: string, code: string) {
    const attempts = await this.redis.incr(otpAttemptsKey(phoneNumber));
    await this.redis.expire(otpAttemptsKey(phoneNumber), OTP_TTL_SECONDS);
    if (attempts > OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException('Too many attempts. Request a new code.');
    }

    const stored = await this.redis.get(otpKey(phoneNumber));
    if (!stored || stored !== code) {
      throw new UnauthorizedException('Invalid or expired code.');
    }
    await this.redis.del(otpKey(phoneNumber));

    const user = await this.findOrCreateCustomer(phoneNumber);
    return this.issueTokens(user.id, user.roleId);
  }

  async refresh(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token invalid or expired.');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: stored.userId },
    });
    return this.issueTokens(user.id, user.roleId);
  }

  async logout(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  private async findOrCreateCustomer(phoneNumber: string) {
    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber },
    });
    if (existing) {
      if (!existing.phoneVerifiedAt) {
        return this.prisma.user.update({
          where: { id: existing.id },
          data: { phoneVerifiedAt: new Date() },
        });
      }
      return existing;
    }

    const customerRole = await this.prisma.role.findUniqueOrThrow({
      where: { name: 'Customer' },
    });

    return this.prisma.user.create({
      data: {
        phoneNumber,
        phoneVerifiedAt: new Date(),
        roleId: customerRole.id,
      },
    });
  }

  private async issueTokens(userId: string, roleId: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, roleId },
      { expiresIn: '15m' },
    );

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(
      Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return { accessToken, refreshToken: rawRefreshToken };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private generateCode(): string {
    return crypto.randomInt(10000, 99999).toString();
  }
}
