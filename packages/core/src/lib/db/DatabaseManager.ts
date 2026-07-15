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
    // Simple mock database retrieval
    const tableNameMatch = sql.match(/from\s+([a-zA-Z0-9_]+)/i);
    const tableName = tableNameMatch ? tableNameMatch[1] : 'default';
    const storeKey = `basekit_db_table_${tableName}`;
    const data = localStorage.getItem(storeKey);
    const list = data ? JSON.parse(data) : [];
    
    // Return all items for simple select queries
    return list as T;
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    if (typeof window === 'undefined') return;
    console.log(`[LocalStorageConnection] Execute: ${sql}`, params);
    
    // Simple mock insert/update/delete support
    const insertMatch = sql.match(/insert\s+into\s+([a-zA-Z0-9_]+)/i);
    const deleteMatch = sql.match(/delete\s+from\s+([a-zA-Z0-9_]+)/i);
    
    if (insertMatch) {
      const tableName = insertMatch[1];
      const storeKey = `basekit_db_table_${tableName}`;
      const data = localStorage.getItem(storeKey);
      const list = data ? JSON.parse(data) : [];
      
      // Add dynamic object
      const newItem = params ? params[0] : {};
      list.push({ id: crypto.randomUUID(), ...newItem, created_at: new Date().toISOString() });
      localStorage.setItem(storeKey, JSON.stringify(list));
      
      // Auto Audit logging trigger simulation
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

export class DatabaseManager implements IDatabaseManager {
  private static instance: DatabaseManager;
  private connections: Map<string, IDatabaseConnection> = new Map();

  private constructor() {
    // Register default connections
    if (typeof window !== 'undefined') {
      this.registerConnection('default', new LocalStorageConnection());
    } else {
      this.registerConnection('default', new MockConnection());
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async getConnection(dbId: string = 'default'): Promise<IDatabaseConnection> {
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
