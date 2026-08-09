import mysql from "mysql2/promise";

// Singleton connection pool — reused across hot-reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var _mysqlPool: mysql.Pool | undefined;
}

function createPool(): mysql.Pool {
  return mysql.createPool({
    host:     process.env.DB_HOST || "localhost",
    port:     parseInt(process.env.DB_PORT || "3306"),
    user:     process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "phil_trades_journal",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    timezone: "Z",
    typeCast(field, next) {
      // Return JS Date objects for datetime columns
      if (field.type === "DATETIME" || field.type === "DATE" || field.type === "TIMESTAMP") {
        const val = field.string();
        return val ? new Date(val) : null;
      }
      return next();
    },
  });
}

export function getPool(): mysql.Pool {
  if (process.env.NODE_ENV === "production") {
    return createPool();
  }
  if (!global._mysqlPool) {
    global._mysqlPool = createPool();
  }
  return global._mysqlPool;
}

export async function query<T = unknown>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<T[]> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

export async function queryOne<T = unknown>(
  sql: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function execute(sql: string, params?: any[]): Promise<mysql.ResultSetHeader> {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return result as mysql.ResultSetHeader;
}
