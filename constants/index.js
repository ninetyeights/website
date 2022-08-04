import { config } from 'dotenv';

config();


export const DB_URL = process.env.DB_URL;
export const DB_USER = process.env.DB_USERNAME;
export const DB_PASS = process.env.DB_PASSWORD;