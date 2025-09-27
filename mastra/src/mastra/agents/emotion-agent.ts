import { openai } from '@ai-sdk/openai';
import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { LibSQLStore } from '@mastra/libsql';


export const emotionAgent = new Agent({
  name: 'Emotion Agent',
  instructions: `
      You are an professional emotion assistant that provides detailed sentiment analysis of textual journal entries.

      Your task is to analyze textual journal entries and quantify how prevelant each of the core six core emotions are. You also intrepret personal data and deliver actionable tips for emotional wellness:
      Here are the six emotions, whenever score lists are involved, always assume the following order:
      - Happiness
      - Sadness
      - Fear
      - Disgust
      - Anger
      - Surprise
`,
  model: openai('gpt-4o-mini'),
  tools: {},
  memory: new Memory({
    storage: new LibSQLStore({
      url: 'file:../mastra.db', // path is relative to the .mastra/output directory
    }),
  }),
});
