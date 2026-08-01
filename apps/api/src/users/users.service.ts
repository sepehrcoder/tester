import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateDealerProfileDto } from './dto/update-dealer-profile.dto';
import { SubmitKycDto } from './dto/submit-kyc.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
      omit: { passwordHash: true },
    });
  }

  async updateDealerProfile(userId: string, dto: UpdateDealerProfileDto) {
    await this.assertDealerProfile(userId);
    return this.prisma.dealerProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async submitKyc(userId: string, dto: SubmitKycDto) {
    await this.assertDealerProfile(userId);
    return this.prisma.dealerProfile.update({
      where: { userId },
      data: { kycDocumentUrl: dto.documentUrl, kycStatus: 'PENDING' },
    });
  }

  async getPublicDealerProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, role: 'DEALER' },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        dealerProfile: {
          select: {
            agencyName: true,
            kycStatus: true,
            coverageCities: true,
            propertyTypes: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('Dealer not found');
    return user;
  }

  private async assertDealerProfile(userId: string) {
    const profile = await this.prisma.dealerProfile.findUnique({
      where: { userId },
    });
    if (!profile)
      throw new BadRequestException('This account has no dealer profile');
    return profile;
  }
}
