import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const entrySchema = z.object({
  chartType: z.string(),
  data: z.any(),
  journals: z.array(z.string())
});

const tipSchema = z.object({
  text: z.string()
});

const classifyEntry = createStep({
  id: 'offer-tips',
  description: 'Provides textual insights on data and suggests ways to support mental well-being',
  inputSchema: entrySchema,
  outputSchema: tipSchema,
  execute: async ({ inputData, mastra }) => {
    const entry = inputData;

    if (!entry) {
      throw new Error('Entry data not found');
    }

    const agent = mastra?.getAgent('emotionAgent');
    if (!agent) {
      throw new Error('Emotion agent not found');
    }

    let prompt = `Given a ${entry.chartType} chart/graph with data: ${JSON.stringify(entry.data)}, qualitatively analyze the user's emotional state and respond as follows:
      1. If the user's emotions appear balanced, provide encouraging feedback.
      2. If the user's emotions indicate challenges, make that observation suggest practical tips to improve mental well-being.
      Respond in two supportive, caring sentences (25 words max). Acknowledge and validate the user's feelings, and gently suggest uplifting or comforting actions. Feedback should be related to the given graph type and data.
      Consider giving actionable tips such as mindfulness exercises, physical activities, social interactions, or creative outlets that are specific to a ${entry.chartType} chart.
      `;

    if (entry.journals && entry.journals.length > 0) {
      prompt += ` Your feedback should be empathetic, be encouraging, be personalized to the user's journals, cite specific moments from the journals found below: ${entry.journals.join(' ')}.`;
    }

    // console.log(prompt);

    const response = await agent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let tipsData = '';

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      tipsData += chunk;
    }


    return {
      text: tipsData
    };
  }
});

const tipsWorkflow = createWorkflow({
  id: 'tips-workflow',
  inputSchema: entrySchema,
  outputSchema: tipSchema
}).then(classifyEntry)

tipsWorkflow.commit();

export { tipsWorkflow };
