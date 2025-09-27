
import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { emotionWorkflow } from './workflows/emotion-workflow';
import { tipsWorkflow } from './workflows/tips-workflow';
import { promptWorkflow } from './workflows/prompt-workflow';
import { emotionAgent } from './agents/emotion-agent';
import express from 'express';
import bodyParser from 'body-parser';


export const mastra = new Mastra({
	workflows: { emotionWorkflow, tipsWorkflow, promptWorkflow },
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
		const workflow = mastra.getWorkflow("emotionWorkflow");

		if (!workflow) {
			return res.status(500).json({ error: 'Workflow not found' });
		}

		const run = await workflow.createRunAsync()
		const result = await run.start({
			inputData: {
				text: text
			},
		});

		if (result.status === "success") {
			const emotions = result.result
			res.json(emotions);
		} else {
			console.error("Workflow failed!");
		}
	} catch (err: any) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

app.post('/api/tips', async (req, res) => {
	try {
		const { chartType, data, journals } = req.body;

		if (!data) {
			return res.status(400).json({ error: 'Missing "text" in request body' });
		}

		// Get the agent
		const agent = mastra.getAgent('emotionAgent');
		if (!agent) {
			return res.status(500).json({ error: 'Emotion agent not found' });
		}
		const workflow = mastra.getWorkflow("tipsWorkflow");

		if (!workflow) {
			return res.status(500).json({ error: 'Workflow not found' });
		}

		const run = await workflow.createRunAsync()
		const result = await run.start({
			inputData: {
				chartType: chartType,
				data: data,
				journals: journals
			},
		});

		if (result.status === "success") {
			const tips = result.result
			res.json(tips);
		} else {
			console.error("Workflow failed!");
		}
	} catch (err: any) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});


app.post('/api/prompt', async (req, res) => {
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
		const workflow = mastra.getWorkflow("promptWorkflow");

		if (!workflow) {
			return res.status(500).json({ error: 'Workflow not found' });
		}

		const run = await workflow.createRunAsync()
		const result = await run.start({
			inputData: {
				text: text
			},
		});

		if (result.status === "success") {
			const tips = result.result
			res.json(tips);
		} else {
			console.error("Workflow failed!");
		}
	} catch (err: any) {
		console.error(err);
		res.status(500).json({ error: err.message });
	}
});

app.listen(4113, () => {
	console.log('Emotion API listening on http://localhost:4113');
});

