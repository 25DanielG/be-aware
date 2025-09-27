import Journal from "../models/journal";
import mongoose, { isValidID } from "../db";
import { ObjectId } from "mongodb";

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

    
    static async add(journal: string, date: Date) {
        const response = await (new Journal({ 
            journal: journal,
            date: date,
            sentiment: [], // todo add sentiment analysis
        })).save();
        return response._id;
    }

    static async deleteJournal(identifier: string) {
        await Journal.deleteOne({ _id : identifier });
    }
}