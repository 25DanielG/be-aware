import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';


export const emotionAgent = new Agent({
  name: 'Emotion Agent',
  instructions: `
      You are an professional emotion assistant that provides detailed sentiment analysis of textual journal entries.

      Your sole task is to analyze textual journal entries and quantify how prevelant each of the core six core emotions are on a scale from 0.00 to 1.00:
      - Happiness
      - Sadness
      - Fear
      - Disgust
      - Anger
      - Surprise
      
      Respond only with six decimal values, comma-separated, in the exact order listed above. Do not include any text, labels, or explanations.
`,
  model: openai('gpt-4o-mini'),
  tools: {},
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
