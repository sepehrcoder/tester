import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlazaDto } from './dto/create-plaza.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@Injectable()
export class PlazaService {
  constructor(private readonly prisma: PrismaService) {}

  create(managerId: string, dto: CreatePlazaDto) {
    return this.prisma.plaza.create({ data: { ...dto, managerId } });
  }

  async listMine(managerId: string) {
    const plazas = await this.prisma.plaza.findMany({
      where: { managerId },
      include: { _count: { select: { units: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const occupancy = await this.prisma.rentalUnit.groupBy({
      by: ['plazaId', 'occupancy'],
      where: { plazaId: { in: plazas.map((p) => p.id) } },
      _count: true,
    });

    return plazas.map((plaza) => {
      const occupied =
        occupancy.find(
          (o) => o.plazaId === plaza.id && o.occupancy === 'OCCUPIED',
        )?._count ?? 0;
      return {
        ...plaza,
        unitCount: plaza._count.units,
        occupiedCount: occupied,
        vacantCount: plaza._count.units - occupied,
      };
    });
  }

  async getOne(id: string, manager: AuthenticatedUser) {
    const plaza = await this.prisma.plaza.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            owner: { select: { id: true, name: true, phone: true } },
            leases: {
              where: { status: 'ACTIVE' },
              include: {
                tenant: { select: { id: true, name: true, phone: true } },
              },
            },
          },
          orderBy: [{ floorNumber: 'asc' }, { createdAt: 'asc' }],
        },
      },
    });
    if (!plaza) throw new NotFoundException('Plaza not found');
    if (plaza.managerId !== manager.id) throw new ForbiddenException();
    return plaza;
  }

  async update(
    id: string,
    manager: AuthenticatedUser,
    dto: Partial<CreatePlazaDto>,
  ) {
    const plaza = await this.prisma.plaza.findUnique({ where: { id } });
    if (!plaza) throw new NotFoundException('Plaza not found');
    if (plaza.managerId !== manager.id) throw new ForbiddenException();
    return this.prisma.plaza.update({ where: { id }, data: dto });
  }
}
