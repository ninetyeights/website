import mongoose from 'mongoose';
import {DB_URL} from '../constants';

const connectDB = handler => async (params, res) => {
    if (mongoose.connections[0].readyState) {
        return handler(params, res)
    }

    await mongoose.connect(DB_URL)
    return handler(params, res)
}

export default connectDB;