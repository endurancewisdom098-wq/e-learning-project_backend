 import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Call the model using streamText
  const result = streamText({
    model: openai('gpt-4o-mini'), // or 'gpt-4o'
    messages,
  });

  // Respond with a data stream that the UI hook can read
  return result.toTextStreamResponse();
}