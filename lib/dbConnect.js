import mongoose from 'mongoose'
import { DB_URL } from '../constants'

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(DB_URL).then(mongoose => mongoose)
  }

  cached.conn = await cached.promise
  return cached.conn
}

export default dbConnect