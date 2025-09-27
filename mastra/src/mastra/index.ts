
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { emotionWorkflow } from './workflows/emotion-workflow';
import { emotionAgent } from './agents/emotion-agent';
import express from 'express';
import bodyParser from 'body-parser';

export const mastra = new Mastra({
  workflows: { emotionWorkflow },
  agents: { emotionAgent },
  storage: new LibSQLStore({
    // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
});

const app = express();
app.use(bodyParser.json());

app.post('/api/emotion', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Missing "text" in request body' });
    }

    // Get the agent
    const agent = mastra.getAgent('emotionAgent');
    if (!agent) {
      return res.status(500).json({ error: 'Emotion agent not found' });
    }

    const response = await agent.generate([
      {
        role: 'user',
        content: text,
      },
    ]);

    const raw = response.text;
    const emotions = raw.split(',').map(v => parseFloat(v.trim()));

    res.json({
      happiness: emotions[0],
      sadness: emotions[1],
      fear: emotions[2],
      disgust: emotions[3],
      anger: emotions[4],
      surprise: emotions[5],
    });

  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(4113, () => {
  console.log('Emotion API listening on http://localhost:4113');
});

