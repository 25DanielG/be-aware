import mongoose from "../db";

export interface User {
    email: string,
    firstName: string,
    lastName: string,
    password: string,
    journals: mongoose.Types.ObjectId[],
}

export default mongoose.model<User>(
    "User",
    new mongoose.Schema({
        email: String,
        firstName: String,
        lastName: String,
        password: String,
        journals: [{
            ref: "Journal",
            type: mongoose.Schema.Types.ObjectId,
        }],
    })
);