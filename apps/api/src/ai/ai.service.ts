import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ListingsService } from '../listings/listings.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  GeminiClient,
  type GeminiContent,
  type GeminiFunctionDeclaration,
  type GeminiPart,
} from './gemini.client';
import { ChatMessageDto } from './dto/chat-message.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

const DEALER_OFFLINE_AFTER_MS = 10 * 60 * 1000; // matches the "coarse presence" heuristic on lastActiveAt
const MAX_TOOL_ROUNDS = 4;

const TOOLS: GeminiFunctionDeclaration[] = [
  {
    name: 'search_listings',
    description:
      'Search live property listings on the marketplace. Use this whenever the user asks to find, browse, or compare properties.',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: 'City name, e.g. Lahore' },
        purpose: { type: 'string', enum: ['SALE', 'RENT'] },
        propertyType: {
          type: 'string',
          enum: ['HOUSE', 'APARTMENT', 'PLOT', 'COMMERCIAL'],
        },
        minPrice: { type: 'integer', description: 'Minimum price in PKR' },
        maxPrice: { type: 'integer', description: 'Maximum price in PKR' },
        beds: { type: 'integer', description: 'Minimum number of bedrooms' },
        verifiedOnly: { type: 'boolean' },
      },
    },
  },
  {
    name: 'find_dealers',
    description:
      'Find verified dealers/agents covering a city and/or property type, sorted by rating.',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        propertyType: {
          type: 'string',
          enum: ['HOUSE', 'APARTMENT', 'PLOT', 'COMMERCIAL'],
        },
      },
    },
  },
  {
    name: 'market_snapshot',
    description:
      'Get average/min/max asking price and listing count for a city/property type/purpose — use this for "what should I expect to pay" style questions.',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string' },
        propertyType: {
          type: 'string',
          enum: ['HOUSE', 'APARTMENT', 'PLOT', 'COMMERCIAL'],
        },
        purpose: { type: 'string', enum: ['SALE', 'RENT'] },
      },
    },
  },
];

export interface ChatResult {
  reply: string;
  listings?: unknown[];
  dealers?: unknown[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly gemini: GeminiClient,
    private readonly prisma: PrismaService,
    private readonly listings: ListingsService,
    private readonly notifications: NotificationsService,
  ) {}

  get enabled(): boolean {
    return this.gemini.enabled;
  }

  // -- the assistant (text + voice both land here, voice is just STT/TTS on the frontend) --

  async chat(
    user: AuthenticatedUser | undefined,
    dto: ChatMessageDto,
  ): Promise<ChatResult> {
    if (!this.gemini.enabled) {
      throw new ServiceUnavailableException(
        'The AI assistant is not configured yet — ask the site admin to add a GEMINI_API_KEY.',
      );
    }

    const contents: GeminiContent[] = (dto.history ?? [])
      .slice(-12) // keep the prompt bounded — the frontend keeps full history for display, we only need recent context
      .map((h) => ({ role: h.role, parts: [{ text: h.text }] }));
    contents.push({ role: 'user', parts: [{ text: dto.message }] });

    const systemInstruction = await this.buildSystemInstruction(user);

    let listingsResult: unknown[] | undefined;
    let dealersResult: unknown[] | undefined;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const modelContent = await this.gemini.generate({
        contents,
        systemInstruction,
        tools: TOOLS,
      });
      contents.push(modelContent);

      const calls = modelContent.parts
        .filter((p) => p.functionCall)
        .map((p) => p.functionCall!);
      if (calls.length === 0) {
        const text = modelContent.parts
          .map((p) => p.text ?? '')
          .join('')
          .trim();
        return {
          reply:
            text || "I couldn't find anything to say — try rephrasing that.",
          listings: listingsResult,
          dealers: dealersResult,
        };
      }

      const responseParts: GeminiPart[] = [];
      for (const call of calls) {
        const outcome = await this.executeTool(call.name, call.args);
        if (outcome.listings) listingsResult = outcome.listings;
        if (outcome.dealers) dealersResult = outcome.dealers;
        responseParts.push({
          functionResponse: {
            name: call.name,
            id: call.id,
            response: { result: outcome.forModel },
          },
        });
      }
      contents.push({ role: 'user', parts: responseParts });
    }

    return {
      reply:
        'I found some results but had trouble summarizing them — see below.',
      listings: listingsResult,
      dealers: dealersResult,
    };
  }

  private async buildSystemInstruction(
    user: AuthenticatedUser | undefined,
  ): Promise<string> {
    const lines = [
      "You are Manzil's AI real estate assistant, embedded in a Pakistani property marketplace and rental-management platform.",
      'Help buyers find properties, help owners/dealers understand the market, and answer general questions about how the platform works.',
      'Always call a tool before stating specific prices, listing details, or dealer names — never invent them.',
      'Prices are in PKR. Keep answers concise (a few sentences, or a short list) — the UI renders any listings/dealers you find as cards separately, so do not repeat every detail as plain text.',
      'If a request is vague (e.g. "I want a house"), ask one short clarifying question or make a reasonable best-guess search and say you can narrow it down.',
      'Stay on real-estate/platform topics. Politely decline anything unrelated (medical, legal, unrelated coding help, etc.).',
    ];

    if (user) {
      lines.push(`The signed-in user is ${user.name}, role ${user.role}.`);

      if (user.role === 'CUSTOMER') {
        const requirements = await this.prisma.requirement.findMany({
          where: { customerId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            propertyType: true,
            purpose: true,
            city: true,
            budgetMin: true,
            budgetMax: true,
            status: true,
          },
        });
        if (requirements.length) {
          lines.push(
            `Their recent requirement posts (use these to personalize suggestions, don't just repeat them back): ${JSON.stringify(requirements)}`,
          );
        }
      }

      if (user.role === 'DEALER') {
        const profile = await this.prisma.dealerProfile.findUnique({
          where: { userId: user.id },
          select: {
            agencyName: true,
            coverageCities: true,
            propertyTypes: true,
            ratingAvg: true,
          },
        });
        if (profile) {
          lines.push(`Their dealer profile: ${JSON.stringify(profile)}`);
        }
      }
    } else {
      lines.push(
        'This visitor is not signed in — you can still help them search, but mention they need an account to contact a dealer or save anything.',
      );
    }

    return lines.join('\n');
  }

  private async executeTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<{ forModel: unknown; listings?: unknown[]; dealers?: unknown[] }> {
    try {
      switch (name) {
        case 'search_listings':
          return this.toolSearchListings(args);
        case 'find_dealers':
          return this.toolFindDealers(args);
        case 'market_snapshot':
          return this.toolMarketSnapshot(args);
        default:
          return { forModel: { error: `Unknown tool ${name}` } };
      }
    } catch (err) {
      this.logger.warn(`Tool ${name} failed: ${(err as Error).message}`);
      return {
        forModel: {
          error:
            'That lookup failed — tell the user briefly and suggest trying different filters.',
        },
      };
    }
  }

  private async toolSearchListings(args: Record<string, unknown>) {
    const result = await this.listings.search({
      city: args.city as string | undefined,
      purpose: args.purpose as never,
      propertyType: args.propertyType as never,
      minPrice: args.minPrice as number | undefined,
      maxPrice: args.maxPrice as number | undefined,
      beds: args.beds as number | undefined,
      verifiedOnly: args.verifiedOnly as boolean | undefined,
      page: 1,
      pageSize: 5,
    });

    const summary = result.items.map((l) => ({
      id: l.id,
      title: l.title,
      city: l.city,
      area: l.area,
      price: l.price.toString(),
      purpose: l.purpose,
      propertyType: l.propertyType,
      beds: l.beds,
      verified: l.verified,
    }));

    return {
      forModel: { total: result.total, shown: summary },
      listings: result.items,
    };
  }

  private async toolFindDealers(args: Record<string, unknown>) {
    const city = args.city as string | undefined;
    const propertyType = args.propertyType as string | undefined;

    const dealers = await this.prisma.dealerProfile.findMany({
      where: {
        kycStatus: 'APPROVED',
        ...(city ? { coverageCities: { has: city } } : {}),
        ...(propertyType
          ? { propertyTypes: { has: propertyType as never } }
          : {}),
      },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { ratingAvg: 'desc' },
      take: 5,
    });

    const summary = dealers.map((d) => ({
      id: d.userId,
      name: d.user.name,
      agencyName: d.agencyName,
      coverageCities: d.coverageCities,
      ratingAvg: d.ratingAvg,
      ratingCount: d.ratingCount,
    }));

    return { forModel: summary, dealers: summary };
  }

  private async toolMarketSnapshot(args: Record<string, unknown>) {
    const where = {
      status: 'APPROVED' as const,
      ...(args.city
        ? {
            city: { equals: args.city as string, mode: 'insensitive' as const },
          }
        : {}),
      ...(args.propertyType
        ? { propertyType: args.propertyType as never }
        : {}),
      ...(args.purpose ? { purpose: args.purpose as never } : {}),
    };
    const agg = await this.prisma.listing.aggregate({
      where,
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _count: true,
    });

    return {
      forModel: {
        count: agg._count,
        avgPrice: agg._avg.price?.toString() ?? null,
        minPrice: agg._min.price?.toString() ?? null,
        maxPrice: agg._max.price?.toString() ?? null,
      },
    };
  }

  // -- auto-reply while a dealer is offline ---------------------------------

  isOffline(lastActiveAt: Date): boolean {
    return Date.now() - lastActiveAt.getTime() > DEALER_OFFLINE_AFTER_MS;
  }

  /** Fire-and-forget from ChatService after a buyer message lands in a conversation with an offline dealer. */
  async maybeAutoReply(
    conversationId: string,
    dealerId: string,
  ): Promise<void> {
    if (!this.gemini.enabled) return;

    try {
      const dealer = await this.prisma.user.findUnique({
        where: { id: dealerId },
        select: {
          name: true,
          lastActiveAt: true,
          dealerProfile: { select: { agencyName: true } },
        },
      });
      if (!dealer || !this.isOffline(dealer.lastActiveAt)) return;

      const conversation = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          lead: { include: { requirement: true } },
          listing: {
            select: { title: true, city: true, price: true, purpose: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 10,
            include: { sender: { select: { name: true, id: true } } },
          },
        },
      });
      if (!conversation) return;

      const history: GeminiContent[] = [...conversation.messages]
        .reverse()
        .map((m) => ({
          role: m.senderId === dealerId ? 'model' : 'user',
          parts: [{ text: m.body }],
        }));

      const context = [
        `You are standing in for ${dealer.name}${dealer.dealerProfile?.agencyName ? ` of ${dealer.dealerProfile.agencyName}` : ''}, a dealer on the Manzil real estate platform, who is currently unavailable.`,
        "Reply briefly and helpfully to the buyer's latest message using only the context given here — do not invent prices, availability, or promises the dealer hasn't made.",
        "Make clear you're an AI assistant standing in, and that the dealer will follow up personally.",
        conversation.lead?.requirement
          ? `Their requirement: ${JSON.stringify({ propertyType: conversation.lead.requirement.propertyType, purpose: conversation.lead.requirement.purpose, city: conversation.lead.requirement.city, budgetMin: conversation.lead.requirement.budgetMin, budgetMax: conversation.lead.requirement.budgetMax })}`
          : '',
        conversation.listing
          ? `The listing being discussed: ${JSON.stringify({ title: conversation.listing.title, city: conversation.listing.city, price: conversation.listing.price.toString(), purpose: conversation.listing.purpose })}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      const result = await this.gemini.generateSafe({
        contents: history,
        systemInstruction: context,
      });
      const text = result?.parts
        .map((p) => p.text ?? '')
        .join('')
        .trim();
      if (!text) return;

      await this.prisma.message.create({
        data: {
          conversationId,
          senderId: dealerId,
          body: text,
          aiGenerated: true,
        },
      });

      await this.notifications.create(
        dealerId,
        'AI_AUTO_REPLY',
        'AI answered a buyer while you were away',
        'Review the conversation and follow up personally when you can.',
        { conversationId },
      );
    } catch (err) {
      this.logger.warn(
        `Auto-reply failed for conversation ${conversationId}: ${(err as Error).message}`,
      );
    }
  }

  // -- AI-assisted chat moderation (runs after the fast regex pass) --------

  /** Fire-and-forget from ChatService.sendMessage — regex already ran synchronously; this is a slower, smarter second pass. */
  async moderateMessageAsync(messageId: string): Promise<void> {
    if (!this.gemini.enabled) return;

    try {
      const message = await this.prisma.message.findUnique({
        where: { id: messageId },
      });
      if (!message || message.flagged) return; // regex already caught it

      const result = await this.gemini.generateSafe({
        contents: [{ role: 'user', parts: [{ text: message.body }] }],
        systemInstruction:
          'You moderate chat messages on a real estate marketplace. Classify the message for: sharing contact info to move off-platform, scam/fraud language, or harassment/abuse. Respond with JSON only: {"flagged": boolean, "reason": string}. Be conservative — only flag clear cases.',
        jsonResponse: true,
      });
      const text = result?.parts.map((p) => p.text ?? '').join('');
      if (!text) return;

      const parsed = JSON.parse(text) as { flagged?: boolean; reason?: string };
      if (parsed.flagged) {
        await this.prisma.message.update({
          where: { id: messageId },
          data: {
            flagged: true,
            flagReason: `AI: ${parsed.reason ?? 'flagged by AI review'}`,
          },
        });
      }
    } catch (err) {
      this.logger.warn(
        `AI moderation failed for message ${messageId}: ${(err as Error).message}`,
      );
    }
  }
}
