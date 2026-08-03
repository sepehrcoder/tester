import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpsertArticleDto } from './dto/upsert-article.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { ArticleCategory } from '../../generated/prisma/enums';

function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  // -- public (§14, Phase 5) -------------------------------------------

  async search(params: { category?: ArticleCategory; q?: string; page: number; pageSize: number }) {
    const where = {
      status: 'PUBLISHED' as const,
      ...(params.category ? { category: params.category } : {}),
      ...(params.q
        ? {
            OR: [
              { title: { contains: params.q, mode: 'insensitive' as const } },
              { excerpt: { contains: params.q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.article.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          category: true,
          tags: true,
          publishedAt: true,
        },
      }),
      this.prisma.article.count({ where }),
    ]);
    return { items, total };
  }

  async findBySlug(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: { author: { select: { id: true, name: true } } },
    });
    if (!article || article.status !== 'PUBLISHED') throw new NotFoundException('Article not found');

    this.prisma.article.update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    const related = await this.prisma.article.findMany({
      where: { status: 'PUBLISHED', category: article.category, id: { not: article.id } },
      orderBy: { publishedAt: 'desc' },
      take: 3,
      select: { id: true, title: true, slug: true, coverImageUrl: true, category: true },
    });

    return { ...article, related };
  }

  // -- admin -------------------------------------------------------------

  listAll() {
    return this.prisma.article.findMany({
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } },
    });
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { author: { select: { id: true, name: true } } },
    });
    if (!article) throw new NotFoundException('Article not found');
    return article;
  }

  private async uniqueSlug(title: string, slugInput: string | undefined, excludeId?: string) {
    const base = slugify(slugInput || title);
    let candidate = base;
    let n = 1;
    while (
      await this.prisma.article.findFirst({
        where: { slug: candidate, ...(excludeId ? { id: { not: excludeId } } : {}) },
      })
    ) {
      candidate = `${base}-${++n}`;
    }
    return candidate;
  }

  async create(author: AuthenticatedUser, dto: UpsertArticleDto) {
    const slug = await this.uniqueSlug(dto.title, dto.slug);
    return this.prisma.article.create({
      data: {
        title: dto.title,
        slug,
        excerpt: dto.excerpt,
        body: dto.body,
        coverImageUrl: dto.coverImageUrl,
        category: dto.category,
        tags: dto.tags ?? [],
        status: dto.status ?? 'DRAFT',
        publishedAt: dto.status === 'PUBLISHED' ? new Date() : undefined,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        authorId: author.id,
      },
    });
  }

  async update(id: string, dto: Partial<UpsertArticleDto>) {
    const existing = await this.findOne(id);
    const slug = dto.slug || dto.title ? await this.uniqueSlug(dto.title ?? existing.title, dto.slug, id) : undefined;
    return this.prisma.article.update({
      where: { id },
      data: {
        ...dto,
        ...(slug ? { slug } : {}),
        ...(dto.status === 'PUBLISHED' && !existing.publishedAt ? { publishedAt: new Date() } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.prisma.article.delete({ where: { id } });
    return { id };
  }
}
