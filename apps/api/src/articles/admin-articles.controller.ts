import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { UpsertArticleDto } from './dto/upsert-article.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

// Article editor (§04/§14 of the platform blueprint) — reuses the generic
// admin single template on the frontend, no bespoke layout needed there.
@ApiTags('admin-articles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/articles')
export class AdminArticlesController {
  constructor(private readonly articles: ArticlesService) {}

  @Get()
  listAll() {
    return this.articles.listAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articles.findOne(id);
  }

  @Post()
  create(@CurrentUser() author: AuthenticatedUser, @Body() dto: UpsertArticleDto) {
    return this.articles.create(author, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<UpsertArticleDto>) {
    return this.articles.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articles.remove(id);
  }
}
