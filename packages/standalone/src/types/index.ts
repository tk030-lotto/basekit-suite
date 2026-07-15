export type PluginMeta = {
  id: string;              // Unique plugin identifier (e.g. 'personal-ops')
  name: string;            // Display name
  route: string;           // Route path (e.g. '/plugins/personal-ops')
  enabled: boolean;        // Active toggle
  icon?: string;           // Sidebar icon key
  category: 'business' | 'operation' | 'defense' | 'ai';
  requiredRole?: 'admin' | 'member';
  networkRequired?: boolean; // Whether plugin accesses network
};

export interface UserSessionContext {
  userId: string;
  email: string;
  isSystemAdmin: boolean;
  pluginRoles: Record<string, 'MANAGER' | 'USER' | 'NONE'>;
  expiresAt: Date | null;
}

export interface IAuthProvider {
  validateCredentials(credentials: any): Promise<UserSessionContext>;
  verifyPluginAccess(context: UserSessionContext, pluginId: string): boolean;
}

export interface IDatabaseConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T>;
  execute(sql: string, params?: any[]): Promise<void>;
  close(): Promise<void>;
}

export interface IDatabaseManager {
  getConnection(dbId?: string): Promise<IDatabaseConnection>;
  registerConnection(dbId: string, connection: IDatabaseConnection): void;
}

export interface ILLMProvider {
  generateText(prompt: string, options?: any): Promise<string>;
  generateJSON<T>(prompt: string, schema: any): Promise<T>;
}

export interface IDataExporter {
  exportCSV<T>(data: T[], columns: string[], filename: string): Promise<void>;
  exportPDF(htmlElementId: string, filename: string): Promise<void>;
}

export interface IDataImporter {
  importCSV<T>(fileContent: string): Promise<T[]>;
}

export interface INotificationProvider {
  send(title: string, body: string, recipient?: string): Promise<void>;
}

export type DatabaseProviderType = 'localstorage' | 'postgres' | 'mock-postgres';

export interface PostgresConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
}

export interface DatabaseConfig {
  provider: DatabaseProviderType;
  postgres?: PostgresConfig;
}
