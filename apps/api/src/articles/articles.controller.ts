import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import type { ArticleCategory } from '../../generated/prisma/enums';

// Public News & Articles archive/single (§14 of the platform blueprint).
@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get()
  search(
    @Query('category') category?: ArticleCategory,
    @Query('q') q?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '12',
  ) {
    return this.articles.search({
      category,
      q,
      page: Number(page) || 1,
      pageSize: Math.min(Number(pageSize) || 12, 50),
    });
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.articles.findBySlug(slug);
  }
}
