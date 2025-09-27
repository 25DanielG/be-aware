import mongoose from "../db";

export interface Journal {
    journal: String,
    date: Date,
    sentiment: Number[],
};

export default mongoose.model<Journal>(
    "Journal",
    new mongoose.Schema({
        journal: String,
        date: Date,
        sentiment: [Number],
    })
);