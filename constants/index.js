import { config } from 'dotenv';

config();


export const DB_URL = process.env.DB_URL;
export const BACKEND_API = process.env.BACKEND_API;