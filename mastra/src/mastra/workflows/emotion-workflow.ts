import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const entrySchema = z.object({
  text: z.string()
});

const emotionSchema = z.object({
  happiness: z.number(),
  sadness: z.number(),
  fear: z.number(),
  disgust: z.number(),
  anger: z.number(),
  surprise: z.number(),
});

const classifyEntry = createStep({
  id: 'classify-entry',
  description: 'Analyzes six emotions in textual journal entry',
  inputSchema: entrySchema,
  outputSchema: emotionSchema,
  execute: async ({ inputData, mastra }) => {
    const entry = inputData;

    if (!entry) {
      throw new Error('Entry data not found');
    }

    const agent = mastra?.getAgent('emotionAgent');
    if (!agent) {
      throw new Error('Emotion agent not found');
    }

    const prompt = `Given this journal entry: ${entry.text}, analyze how prevalent each of these
    six primary emotions are on a scale from 0.0 to 1.0: happiness, sadness, fear, disgust, anger, surprise

    Respond with only comma seperated (",") decimal values in the exact order of emotions listed above.`;

    const response = await agent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let emotionsData = '';

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      emotionsData += chunk;
    }

    const emotions = emotionsData.trim().split(',').map((v) => parseFloat(v.trim()));


    return {
      happiness: emotions[0],
      sadness: emotions[1],
      fear: emotions[2],
      disgust: emotions[3],
      anger: emotions[4],
      surprise: emotions[5],
    };
  }
});

const emotionWorkflow = createWorkflow({
  id: 'emotion-workflow',
  inputSchema: entrySchema,
  outputSchema: emotionSchema
})
  .then(classifyEntry)

emotionWorkflow.commit();

export { emotionWorkflow };
