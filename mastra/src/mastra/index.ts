import express from 'express';
import bodyParser from 'body-parser';
import { Mastra } from '@mastra/core/mastra';
import { emotionWorkflow } from './workflows/emotion-workflow';
import { emotionAgent } from './agents/emotion-agent';

const mastra = new Mastra({
  agents: { emotionAgent },
  workflows: { emotionWorkflow },
});
