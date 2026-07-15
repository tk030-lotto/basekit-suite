import { IDatabaseConnection, IDatabaseManager } from '../../types';

class MockConnection implements IDatabaseConnection {
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    console.log(`[MockConnection] Query SQL: ${sql}`, params);
    return [] as unknown as T;
  }
  async execute(sql: string, params?: any[]): Promise<void> {
    console.log(`[MockConnection] Execute SQL: ${sql}`, params);
  }
  async close(): Promise<void> {}
}

class LocalStorageConnection implements IDatabaseConnection {
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    if (typeof window === 'undefined') {
      return [] as unknown as T;
    }
    console.log(`[LocalStorageConnection] Query: ${sql}`, params);
    const tableNameMatch = sql.match(/from\s+([a-zA-Z0-9_]+)/i);
    const tableName = tableNameMatch ? tableNameMatch[1] : 'default';
    const storeKey = `basekit_db_table_${tableName}`;
    const data = localStorage.getItem(storeKey);
    const list = data ? JSON.parse(data) : [];
    return list as T;
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    if (typeof window === 'undefined') return;
    console.log(`[LocalStorageConnection] Execute: ${sql}`, params);
    
    const insertMatch = sql.match(/insert\s+into\s+([a-zA-Z0-9_]+)/i);
    const deleteMatch = sql.match(/delete\s+from\s+([a-zA-Z0-9_]+)/i);
    
    if (insertMatch) {
      const tableName = insertMatch[1];
      const storeKey = `basekit_db_table_${tableName}`;
      const data = localStorage.getItem(storeKey);
      const list = data ? JSON.parse(data) : [];
      
      const newItem = params ? params[0] : {};
      list.push({ id: crypto.randomUUID(), ...newItem, created_at: new Date().toISOString() });
      localStorage.setItem(storeKey, JSON.stringify(list));
      
      this.writeAuditLog('INSERT', tableName, {}, newItem);
    } else if (deleteMatch) {
      const tableName = deleteMatch[1];
      const storeKey = `basekit_db_table_${tableName}`;
      localStorage.removeItem(storeKey);
      this.writeAuditLog('DELETE', tableName, {}, {});
    }
  }

  private writeAuditLog(action: string, table: string, oldVal: any, newVal: any) {
    const auditLogsKey = 'basekit_db_table_audit_logs';
    const rawLogs = localStorage.getItem(auditLogsKey);
    const logs = rawLogs ? JSON.parse(rawLogs) : [];
    logs.push({
      id: crypto.randomUUID(),
      action,
      table_name: table,
      old_value: JSON.stringify(oldVal),
      new_value: JSON.stringify(newVal),
      created_at: new Date().toISOString()
    });
    localStorage.setItem(auditLogsKey, JSON.stringify(logs));
  }

  async close(): Promise<void> {}
}

class MockPostgresConnection implements IDatabaseConnection {
  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    if (typeof window === 'undefined') {
      return [] as unknown as T;
    }
    console.log(`[MockPostgresConnection] Query SQL: ${sql}`, params);
    const tableNameMatch = sql.match(/from\s+([a-zA-Z0-9_]+)/i);
    const tableName = tableNameMatch ? tableNameMatch[1] : 'default';
    const storeKey = `basekit_mock_pg_table_${tableName}`;
    const data = localStorage.getItem(storeKey);
    const list = data ? JSON.parse(data) : [];
    return list as T;
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    if (typeof window === 'undefined') return;
    console.log(`[MockPostgresConnection] Execute SQL: ${sql}`, params);
    
    const insertMatch = sql.match(/insert\s+into\s+([a-zA-Z0-9_]+)/i);
    const deleteMatch = sql.match(/delete\s+from\s+([a-zA-Z0-9_]+)/i);
    
    if (insertMatch) {
      const tableName = insertMatch[1];
      const storeKey = `basekit_mock_pg_table_${tableName}`;
      const data = localStorage.getItem(storeKey);
      const list = data ? JSON.parse(data) : [];
      
      const newItem = params ? params[0] : {};
      list.push({ id: crypto.randomUUID(), ...newItem, created_at: new Date().toISOString() });
      localStorage.setItem(storeKey, JSON.stringify(list));
      
      this.writeAuditLog('INSERT', tableName, {}, newItem);
    } else if (deleteMatch) {
      const tableName = deleteMatch[1];
      const storeKey = `basekit_mock_pg_table_${tableName}`;
      localStorage.removeItem(storeKey);
      this.writeAuditLog('DELETE', tableName, {}, {});
    }
  }

  private writeAuditLog(action: string, table: string, oldVal: any, newVal: any) {
    const auditLogsKey = 'basekit_mock_pg_table_audit_logs';
    const rawLogs = localStorage.getItem(auditLogsKey);
    const logs = rawLogs ? JSON.parse(rawLogs) : [];
    logs.push({
      id: crypto.randomUUID(),
      action,
      table_name: table,
      old_value: JSON.stringify(oldVal),
      new_value: JSON.stringify(newVal),
      created_at: new Date().toISOString()
    });
    localStorage.setItem(auditLogsKey, JSON.stringify(logs));
  }

  async close(): Promise<void> {}
}

export class PostgreSqlConnection implements IDatabaseConnection {
  private config: any;

  constructor(config?: any) {
    this.config = config;
  }

  private getConfig(): any {
    if (this.config) return this.config;
    if (typeof window !== 'undefined') {
      return {
        host: localStorage.getItem('basekit_db_postgres_host') || 'localhost',
        port: parseInt(localStorage.getItem('basekit_db_postgres_port') || '5432', 10),
        database: localStorage.getItem('basekit_db_postgres_database') || 'postgres',
        user: localStorage.getItem('basekit_db_postgres_user') || 'postgres',
        password: localStorage.getItem('basekit_db_postgres_password') || '',
        ssl: localStorage.getItem('basekit_db_postgres_ssl') === 'true'
      };
    } else {
      return {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME || 'postgres',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true'
      };
    }
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T> {
    const config = this.getConfig();

    if (typeof window !== 'undefined') {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'query', sql, params, config })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      const data = await response.json();
      return data.rows as T;
    } else {
      const { Client } = require('pg');
      const client = new Client({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false
      });
      await client.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows as T;
      } finally {
        await client.end();
      }
    }
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    const config = this.getConfig();

    if (typeof window !== 'undefined') {
      const response = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', sql, params, config })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
    } else {
      const { Client } = require('pg');
      const client = new Client({
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        password: config.password,
        ssl: config.ssl ? { rejectUnauthorized: false } : false
      });
      await client.connect();
      try {
        await client.query(sql, params);
      } finally {
        await client.end();
      }
    }
  }

  async close(): Promise<void> {}
}

export class DatabaseManager implements IDatabaseManager {
  private static instance: DatabaseManager;
  private connections: Map<string, IDatabaseConnection> = new Map();

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async getConnection(dbId: string = 'default'): Promise<IDatabaseConnection> {
    if (dbId === 'default') {
      let provider = 'localstorage';
      if (typeof window !== 'undefined') {
        provider = localStorage.getItem('basekit_db_provider') || 'localstorage';
      } else {
        provider = process.env.DB_PROVIDER || 'localstorage';
      }

      if (provider === 'postgres') {
        return new PostgreSqlConnection();
      } else if (provider === 'mock-postgres') {
        return new MockPostgresConnection();
      } else {
        return typeof window !== 'undefined' ? new LocalStorageConnection() : new MockConnection();
      }
    }

    const conn = this.connections.get(dbId);
    if (!conn) {
      throw new Error(`Database connection "${dbId}" is not registered.`);
    }
    return conn;
  }

  public registerConnection(dbId: string, connection: IDatabaseConnection): void {
    this.connections.set(dbId, connection);
  }
}

export const databaseManager = DatabaseManager.getInstance();
export default databaseManager;

