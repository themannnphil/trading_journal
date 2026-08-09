import { MongoClient, Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function connect(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI environment variable is not set");
  return new MongoClient(uri).connect();
}

// Lazy: never runs at import time — only when getDb() is first called at runtime.
export async function getDb(): Promise<Db> {
  const promise =
    process.env.NODE_ENV === "development"
      ? (global._mongoClientPromise ??= connect())
      : connect();

  const client = await promise;
  return client.db(process.env.MONGODB_DB ?? "phil_trades_journal");
}
