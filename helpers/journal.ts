import Journal from "../models/journal";
import mongoose, { isValidID } from "../db";
import { ObjectId } from "mongodb";
import config from "../config";

type SentimentScores = {
    happiness: number;
    sadness: number;
    fear: number;
    disgust: number;
    anger: number;
    surprise: number;
};

export default class {
    static async exists(identifier: string) {
        return isValidID(identifier) && (await this.getJournal(identifier)) != null;
    }

    static async getJournal(identifier: string) {
        return await Journal.findById(mongoose.Types.ObjectId(identifier));
    }

    static async getAll() {
        return await Journal.find().lean();
    }

    static async removeAll() {
        await Journal.deleteMany({});    
    }

      
    static async getJournalSentiment(agentId: string, entry: string): Promise<number[]> {
        const response = await fetch(config.api.apiEmotion, {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
                text: entry
            }),
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log([data.happiness, data.sadness, data.fear, data.disgust, data.anger, data.disgust]);
        return [data.happiness, data.sadness, data.fear, data.disgust, data.anger, data.disgust];
    }


    static async add(journal: string, date: Date) {
        const s = await this.getJournalSentiment(config.api.agentId, journal);
        const response = await (new Journal({ 
            journal: journal,
            date: date,
            sentiment: s,
        })).save();
        return response._id;
    }

    static async deleteJournal(identifier: string) {
        await Journal.deleteOne({ _id : identifier });
    }
}

