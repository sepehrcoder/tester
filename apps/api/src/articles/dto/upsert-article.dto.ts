import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUrl, MinLength } from 'class-validator';
import { ArticleCategory, ArticleStatus } from '../../../generated/prisma/enums';

export class UpsertArticleDto {
  @ApiProperty()
  @IsString()
  @MinLength(4)
  title: string;

  @ApiProperty({ required: false, description: 'Auto-generated from title if omitted' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty()
  @IsString()
  @MinLength(10)
  excerpt: string;

  @ApiProperty()
  @IsString()
  @MinLength(20)
  body: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiProperty({ enum: ArticleCategory })
  @IsEnum(ArticleCategory)
  category: ArticleCategory;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ enum: ArticleStatus, required: false })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  metaDescription?: string;
}
