import { z } from 'zod';

export const RAG_MODE_SET = ['Auto', 'None', 'CurrentPost', 'Search', 'Provided'] as const;
export type RagModeType = typeof RAG_MODE_SET[number];

const ClientMessageSchema = z.object({
  conversationId: z.string().nullable(),
  userId: z.string(),
  content: z.string(),
});

const PromptContextOptionsSchema = z.object({
  ragMode: z.enum(RAG_MODE_SET),
  postId: z.string().optional(),
  includeComments: z.boolean().optional(),
  postContext: z.optional(z.union([z.literal('post-page'), z.literal('post-editor')])),
});

export const ClaudeMessageRequestSchema = z.object({
  newMessage: ClientMessageSchema,
  promptContextOptions: PromptContextOptionsSchema,
  newConversationChannelId: z.string().optional(),
});

export type ClientMessage = z.infer<typeof ClientMessageSchema>;
export type PromptContextOptions = z.infer<typeof PromptContextOptionsSchema>;
export type ClaudeMessageRequest = z.infer<typeof ClaudeMessageRequestSchema>;

type LlmStreamContent = {
  conversationId: string;
  content: string;
};

type LlmStreamChunk = {
  conversationId: string;
  chunk: string;
};

type LlmStreamError = {
  conversationId: string;
  error: string;
};

type LlmStreamEnd = {
  conversationId: string;
};

export type LlmCreateConversationMessage = {
  eventType: 'llmCreateConversation';
  title: string;
  conversationId: string;
  /** Stringified date */
  createdAt: string;
  userId: string;
  channelId: string;
}

export type LlmStreamContentMessage = {
  eventType: 'llmStreamContent',
  data: LlmStreamContent
};

export type LlmStreamChunkMessage = {
  eventType: 'llmStreamChunk',
  data: LlmStreamChunk
};

export type LlmStreamErrorMessage = {
  eventType: 'llmStreamError',
  data: LlmStreamError
};

export type LlmStreamEndMessage = {
  eventType: 'llmStreamEnd',
  data: LlmStreamEnd
};

export type LlmStreamMessage = LlmCreateConversationMessage | LlmStreamContentMessage | LlmStreamChunkMessage | LlmStreamErrorMessage | LlmStreamEndMessage;
