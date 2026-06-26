/**
 * lib/db.js
 * Robust MongoDB connection helper for Next.js serverless functions.
 *
 * Exports: connectToDatabase() -> { client, db }
 *
 * Environment variables:
 * - MONGODB_URI (required) : full connection string
 * - MONGODB_DB  (optional) : database name (if not present, the DB from the connection string is used)
 */

const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

const options = {
  // add options here if needed
};

// In production, create a new client for each lambda invocation is acceptable but
// connecting repeatedly is slow. Use a cached promise to reuse the connection.
let client;
let clientPromise;

if (process.env.NODE_ENV === "development") {
  // In development, use a global to preserve the client across module reloads/hot-reload
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production, do not use global (each serverless environment instance will cache this file)
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

async function connectToDatabase() {
  const client = await clientPromise;
  const dbName = process.env.MONGODB_DB || undefined; // undefined uses DB from URI if present
  const db = client.db(dbName);
  return { client, db };
}

module.exports = { connectToDatabase };
