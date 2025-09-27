import Journal from "../models/journal";
import mongoose, { isValidID } from "../db";
import { ObjectId } from "mongodb";
import config from "../config";
import { Types } from "mongoose";

export default class {
    static async generateTip(chartType: string, chartData: any, journals: string[]): Promise<number[]> {
        const response = await fetch(config.api.apiTips, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chartType: chartType,
                data: chartData,
                journals: journals
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(data.text);
        return data.text;
    }

    static async getJournalPrompt(text: string): Promise<string> {
        const response = await fetch(config.api.apiPrompt, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: text
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        const data = await response.json();
        return data.text;
    }
}

