import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  // Deliberately available to anonymous visitors too — "help everyone find
  // what they need" includes people who haven't signed up yet.
  @UseGuards(OptionalJwtAuthGuard)
  @Post('chat')
  chat(
    @CurrentUser() user: AuthenticatedUser | undefined,
    @Body() dto: ChatMessageDto,
  ) {
    return this.ai.chat(user, dto);
  }
}
