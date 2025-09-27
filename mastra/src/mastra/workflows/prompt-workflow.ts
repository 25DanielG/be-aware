import { createStep, createWorkflow } from '@mastra/core/workflows';
import { z } from 'zod';

const entrySchema = z.object({
  text: z.string()
});

const promptSchema = z.object({
  text: z.string()
});

const classifyEntry = createStep({
  id: 'prompt-journal',
  description: 'Prompts guiding questions during journal writing',
  inputSchema: entrySchema,
  outputSchema: promptSchema,
  execute: async ({ inputData, mastra }) => {
    const entry = inputData;

    if (!entry) {
      throw new Error('Entry data not found');
    }

    const agent = mastra?.getAgent('emotionAgent');
    if (!agent) {
      throw new Error('Emotion agent not found');
    }

    const prompt = `Here’s an unfinished journal entry: "${entry.text}". Suggest one guiding question (under 25 words) that helps the user expand or continue their writing.`;

    const response = await agent.stream([
      {
        role: 'user',
        content: prompt,
      },
    ]);

    let promptData = '';

    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
      promptData += chunk;
    }
    
    return {
      text: promptData
    };
  }
});

const promptWorkflow = createWorkflow({
  id: 'prompt-workflow',
  inputSchema: entrySchema,
  outputSchema: promptSchema
})
  .then(classifyEntry)

promptWorkflow.commit();

export { promptWorkflow };
