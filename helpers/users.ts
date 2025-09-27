import User from "../models/user";
import mongoose, { isValidID } from "../db";
import { ObjectId } from "mongodb";
import { createHash } from "crypto";

export default class {
    static async getUser(identifier: string) {
        return await User.findById(mongoose.Types.ObjectId(identifier));
    }

    static async getUserByEmail(email: string) {
        return await User.findOne({ email: email });
    }

    static async exists(identifier: string) {
        return isValidID(identifier) && (await this.getUser(identifier)) != null;
    }

    static async getAll() {
        return await User.find().lean();
    }
    
    static async getEmail(identifier: string) {
        return (await this.getUser(identifier)).email;
    }

    static async getName(identifier: string) {
        return (await this.getUser(identifier)).firstName;
    }

    static async add(email: string, firstName: string, lastName: string, password: string) {
        const p = createHash('sha256').update(password, "utf-8").digest('hex'); // hash password

        const response = await (new User({ 
            email: email,
            firstName: firstName,
            lastName: lastName,
            password: p,
            journals: [],
        })).save();
        return response._id;
    }

    static async removeAll() {
        await User.deleteMany({});
    }

    static async remove(identifier: string) {
        await User.deleteOne({ _id: identifier });
    }

    static async getUserJournals(identifier: string) {
        const user = await this.getUser(identifier);
        return user.journals;
    }

    static async authenticate(email: string, password: string) {
        const p = createHash('sha256').update(password, "utf-8").digest('hex'); // hash password
        return await User.findOne({ email: email, password: p });
    }
}