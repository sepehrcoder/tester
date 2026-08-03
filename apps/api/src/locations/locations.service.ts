import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Backs the structured City -> Society -> Phase -> Block location picker
// (§03/1 of the platform blueprint). Lookups are public (used by search-side
// pickers); the findOrCreate helpers are used only from the listing
// create/update path, so a dealer typing a new society name doesn't get
// blocked on an admin pre-seeding it first.
@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  listSocieties(city: string, q?: string) {
    return this.prisma.society.findMany({
      where: {
        city: { equals: city, mode: 'insensitive' },
        ...(q ? { name: { contains: q, mode: 'insensitive' } } : {}),
      },
      orderBy: { name: 'asc' },
    });
  }

  listPhases(societyId: string) {
    return this.prisma.phase.findMany({
      where: { societyId },
      orderBy: { name: 'asc' },
    });
  }

  listBlocks(phaseId: string) {
    return this.prisma.block.findMany({
      where: { phaseId },
      orderBy: { name: 'asc' },
    });
  }

  async findOrCreateSociety(city: string, name: string) {
    return this.prisma.society.upsert({
      where: { city_name: { city, name } },
      update: {},
      create: { city, name },
    });
  }

  async findOrCreatePhase(societyId: string, name: string) {
    return this.prisma.phase.upsert({
      where: { societyId_name: { societyId, name } },
      update: {},
      create: { societyId, name },
    });
  }

  async findOrCreateBlock(phaseId: string, name: string) {
    return this.prisma.block.upsert({
      where: { phaseId_name: { phaseId, name } },
      update: {},
      create: { phaseId, name },
    });
  }

  /**
   * Resolves societyName/phaseName/blockName strings into hierarchy IDs,
   * creating any that don't exist yet, and derives the legacy `area`
   * display string from them. Returns undefined fields where no name was
   * given, so a partial update (e.g. society only) doesn't null out an
   * existing phase/block.
   */
  async resolveHierarchy(
    city: string,
    societyName?: string,
    phaseName?: string,
    blockName?: string,
  ): Promise<{ societyId?: string; phaseId?: string; blockId?: string; area?: string }> {
    if (!societyName) return {};

    const society = await this.findOrCreateSociety(city, societyName);
    if (!phaseName) {
      return { societyId: society.id, area: society.name };
    }

    const phase = await this.findOrCreatePhase(society.id, phaseName);
    if (!blockName) {
      return { societyId: society.id, phaseId: phase.id, area: `${society.name}, ${phase.name}` };
    }

    const block = await this.findOrCreateBlock(phase.id, blockName);
    return {
      societyId: society.id,
      phaseId: phase.id,
      blockId: block.id,
      area: `${society.name}, ${phase.name}, ${block.name}`,
    };
  }
}
