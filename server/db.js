import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Active DB Configuration
export let dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'music_game_db',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: 0,
  multipleStatements: true
};

let pool = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

export async function updateDbConfig(newConfig) {
  if (pool) {
    try {
      await pool.end();
    } catch (e) {
      console.warn('Error closing previous pool:', e.message);
    }
  }
  dbConfig = {
    ...dbConfig,
    ...newConfig,
    port: parseInt(newConfig.port || dbConfig.port, 10),
    multipleStatements: true
  };
  pool = mysql.createPool(dbConfig);
  return await testConnection();
}

export async function testConnection() {
  const startTime = Date.now();
  try {
    const currentPool = getPool();
    const connection = await currentPool.getConnection();
    const [rows] = await connection.query('SELECT 1 AS connected, DATABASE() AS db_name, VERSION() AS version');
    connection.release();
    const durationMs = Date.now() - startTime;
    return {
      success: true,
      durationMs,
      database: rows[0]?.db_name || dbConfig.database,
      version: rows[0]?.version,
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database
      }
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      code: err.code,
      config: {
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        database: dbConfig.database
      }
    };
  }
}

export async function query(sql, params = []) {
  const startTime = performance.now();
  const currentPool = getPool();
  try {
    const [results, fields] = await currentPool.query(sql, params);
    const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      success: true,
      results,
      rowCount: Array.isArray(results) ? results.length : results?.affectedRows ?? 0,
      fields: fields ? fields.map(f => f.name) : [],
      durationMs
    };
  } catch (err) {
    const durationMs = parseFloat((performance.now() - startTime).toFixed(2));
    return {
      success: false,
      error: err.message,
      code: err.code,
      durationMs
    };
  }
}

export async function getDbStats() {
  try {
    const currentPool = getPool();
    const [tables] = await currentPool.query(
      "SELECT table_name, engine, table_rows, create_time FROM information_schema.tables WHERE table_schema = ? AND table_type = 'BASE TABLE'",
      [dbConfig.database]
    );

    const counts = {};
    for (const t of tables) {
      try {
        const [c] = await currentPool.query(`SELECT COUNT(*) AS total FROM \`${t.TABLE_NAME || t.table_name}\``);
        counts[t.TABLE_NAME || t.table_name] = c[0].total;
      } catch {
        counts[t.TABLE_NAME || t.table_name] = t.TABLE_ROWS || 0;
      }
    }

    return {
      success: true,
      database: dbConfig.database,
      tableCount: tables.length,
      tables: tables.map(t => ({
        name: t.TABLE_NAME || t.table_name,
        engine: t.ENGINE || t.engine,
        rowCount: counts[t.TABLE_NAME || t.table_name] ?? 0
      }))
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}

export async function initializeSchema() {
  try {
    const schemaPath = path.resolve(__dirname, '../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Connect without specific database to ensure database exists
    const adminConnection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true
    });

    await adminConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await adminConnection.query(`USE \`${dbConfig.database}\`;`);

    // Parse and execute statements
    // We execute standard statements and triggers
    const statements = schemaSql
      .replace(/DELIMITER \$\$[\s\S]*?DELIMITER ;/g, '') // strip triggers for separate handling
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    for (const stmt of statements) {
      if (stmt.toLowerCase().startsWith('use ') || stmt.toLowerCase().startsWith('create database')) continue;
      try {
        await adminConnection.query(stmt);
      } catch (e) {
        console.warn(`Statement warning: ${e.message.slice(0, 80)}`);
      }
    }

    // Add triggers
    try {
      await adminConnection.query(`
        DROP TRIGGER IF EXISTS trg_after_insert_game_attempt_score;
      `);
      await adminConnection.query(`
        CREATE TRIGGER trg_after_insert_game_attempt_score
        AFTER INSERT ON game_attempts
        FOR EACH ROW
        BEGIN
            UPDATE game_sessions
            SET total_score = (
                SELECT COALESCE(SUM(points_awarded), 0)
                FROM game_attempts
                WHERE session_id = NEW.session_id
            )
            WHERE session_id = NEW.session_id;
        END;
      `);
    } catch (e) {
      console.warn('Trigger 1 creation warning:', e.message);
    }

    try {
      await adminConnection.query(`
        DROP TRIGGER IF EXISTS trg_after_insert_game_attempt_xp;
      `);
      await adminConnection.query(`
        CREATE TRIGGER trg_after_insert_game_attempt_xp
        AFTER INSERT ON game_attempts
        FOR EACH ROW
        BEGIN
            DECLARE target_user_id INT;
            SELECT user_id INTO target_user_id FROM game_sessions WHERE session_id = NEW.session_id LIMIT 1;
            IF target_user_id IS NOT NULL THEN
                UPDATE users
                SET total_xp = (
                    SELECT COALESCE(SUM(ga.points_awarded), 0)
                    FROM game_attempts ga
                    INNER JOIN game_sessions gs ON ga.session_id = gs.session_id
                    WHERE gs.user_id = target_user_id
                )
                WHERE user_id = target_user_id;
            END IF;
        END;
      `);
    } catch (e) {
      console.warn('Trigger 2 creation warning:', e.message);
    }

    await adminConnection.end();

    return {
      success: true,
      message: `Database '${dbConfig.database}' initialized successfully in InnoDB.`
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}
