import { IDatabaseConnection } from '../../types';

export class LocalStorageConnection implements IDatabaseConnection {
  // Parsing helper to split commas ignoring commas inside quotes
  private splitByCommaOutsideQuotes(str: string): string[] {
    const result: string[] = [];
    let current = '';
    let inSingleQuote = false;
    let inDoubleQuote = false;

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char === "'" && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
        current += char;
      } else if (char === '"' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
        current += char;
      } else if (char === ',' && !inSingleQuote && !inDoubleQuote) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  // Pre-process SQL: normalize white space, replace "?" with "$1", "$2", etc.
  private normalizeSql(sql: string): string {
    let paramCounter = 1;
    // Replace ? with $1, $2...
    return sql.replace(/\s+/g, ' ').trim().replace(/\?/g, () => `$${paramCounter++}`);
  }

  private parseWhereClause(whereStr: string | undefined, params: any[]) {
    if (!whereStr) return null;
    const conditions = [];
    const parts = whereStr.split(/\s+and\s+/i);
    
    for (const part of parts) {
      const match = part.trim().match(/^([a-zA-Z0-9_.]+)\s*(=|!=|<>|like|is\s+null|is\s+not\s+null)(?:\s+(.+))?$/i);
      if (!match) continue;
      
      const [, column, operator, rawVal] = match;
      const op = operator.toUpperCase();
      let value: any = undefined;

      if (op === 'IS NULL' || op === 'IS NOT NULL') {
        value = null;
      } else if (rawVal) {
        const trimmedVal = rawVal.trim();
        if (trimmedVal.startsWith('$')) {
          const idx = parseInt(trimmedVal.substring(1), 10) - 1;
          value = params[idx];
        } else if (trimmedVal.startsWith("'") && trimmedVal.endsWith("'")) {
          value = trimmedVal.slice(1, -1);
        } else if (trimmedVal.startsWith('"') && trimmedVal.endsWith('"')) {
          value = trimmedVal.slice(1, -1);
        } else if (trimmedVal.toLowerCase() === 'true') {
          value = true;
        } else if (trimmedVal.toLowerCase() === 'false') {
          value = false;
        } else if (!isNaN(Number(trimmedVal))) {
          value = Number(trimmedVal);
        } else {
          value = trimmedVal;
        }
      }

      conditions.push({ column, operator: op, value });
    }
    return conditions;
  }

  private parseValuesClause(valsStr: string, params: any[]) {
    const parts = this.splitByCommaOutsideQuotes(valsStr);
    return parts.map(part => {
      if (part.startsWith('$')) {
        const idx = parseInt(part.substring(1), 10) - 1;
        return params[idx];
      } else if (part.startsWith("'") && part.endsWith("'")) {
        return part.slice(1, -1);
      } else if (part.startsWith('"') && part.endsWith('"')) {
        return part.slice(1, -1);
      } else if (part.toLowerCase() === 'true') {
        return true;
      } else if (part.toLowerCase() === 'false') {
        return false;
      } else if (part.toLowerCase() === 'null') {
        return null;
      } else if (!isNaN(Number(part))) {
        return Number(part);
      }
      return part;
    });
  }

  private parseSetClause(setStr: string, params: any[]): Record<string, any> {
    const parts = this.splitByCommaOutsideQuotes(setStr);
    const updateFields: Record<string, any> = {};
    for (const part of parts) {
      const eqIdx = part.indexOf('=');
      if (eqIdx === -1) continue;
      const col = part.substring(0, eqIdx).trim();
      const valStr = part.substring(eqIdx + 1).trim();

      let value: any;
      if (valStr.startsWith('$')) {
        const idx = parseInt(valStr.substring(1), 10) - 1;
        value = params[idx];
      } else if (valStr.startsWith("'") && valStr.endsWith("'")) {
        value = valStr.slice(1, -1);
      } else if (valStr.startsWith('"') && valStr.endsWith('"')) {
        value = valStr.slice(1, -1);
      } else if (valStr.toLowerCase() === 'true') {
        value = true;
      } else if (valStr.toLowerCase() === 'false') {
        value = false;
      } else if (valStr.toLowerCase() === 'null') {
        value = null;
      } else if (!isNaN(Number(valStr))) {
        value = Number(valStr);
      } else {
        value = valStr;
      }
      updateFields[col] = value;
    }
    return updateFields;
  }

  private evaluateCondition(item: any, condition: { column: string; operator: string; value: any }): boolean {
    const itemVal = item[condition.column];
    const condVal = condition.value;

    switch (condition.operator) {
      case '=':
        return itemVal === condVal;
      case '!=':
      case '<>':
        return itemVal !== condVal;
      case 'LIKE': {
        if (typeof itemVal !== 'string' || typeof condVal !== 'string') return false;
        const escaped = condVal.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        const regexStr = '^' + escaped.replace(/%/g, '.*').replace(/_/g, '.') + '$';
        const regex = new RegExp(regexStr, 'i');
        return regex.test(itemVal);
      }
      case 'IS NULL':
        return itemVal === null || itemVal === undefined;
      case 'IS NOT NULL':
        return itemVal !== null && itemVal !== undefined;
      default:
        return false;
    }
  }

  private evaluateConditions(item: any, conditions: any[] | null): boolean {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(cond => this.evaluateCondition(item, cond));
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

  async query<T = any>(sql: string, params: any[] = []): Promise<T> {
    if (typeof window === 'undefined') {
      return [] as unknown as T;
    }

    const trimmed = sql.trim().toLowerCase();
    if (trimmed.startsWith('insert') || trimmed.startsWith('update') || trimmed.startsWith('delete')) {
      await this.execute(sql, params);
      return [] as unknown as T;
    }

    console.log(`[LocalStorageConnection] Query: ${sql}`, params);
    const normalized = this.normalizeSql(sql);

    const selectMatch = normalized.match(/^select\s+(.+?)\s+from\s+([a-zA-Z0-9_]+)(?:\s+where\s+(.+?))?(?:\s+order\s+by\s+(.+?))?(?:\s+limit\s+(\d+))?$/i);
    if (!selectMatch) {
      // Fallback simple parsing if match fails
      const tableNameMatch = normalized.match(/from\s+([a-zA-Z0-9_]+)/i);
      const tableName = tableNameMatch ? tableNameMatch[1] : 'default';
      const storeKey = `basekit_db_table_${tableName}`;
      const data = localStorage.getItem(storeKey);
      return (data ? JSON.parse(data) : []) as T;
    }

    const [, , tableName, whereStr, orderByStr, limitStr] = selectMatch;
    const storeKey = `basekit_db_table_${tableName}`;
    const data = localStorage.getItem(storeKey);
    let list: any[] = data ? JSON.parse(data) : [];

    // Filter
    const conditions = this.parseWhereClause(whereStr, params);
    if (conditions && conditions.length > 0) {
      list = list.filter(item => this.evaluateConditions(item, conditions));
    }

    // Sort
    if (orderByStr) {
      const parts = orderByStr.trim().split(/\s+/);
      const col = parts[0];
      const desc = parts[1] && parts[1].toUpperCase() === 'DESC';
      list.sort((a, b) => {
        const valA = a[col];
        const valB = b[col];
        if (valA === valB) return 0;
        if (valA == null) return desc ? 1 : -1;
        if (valB == null) return desc ? -1 : 1;
        if (valA < valB) return desc ? 1 : -1;
        return desc ? -1 : 1;
      });
    }

    // Limit
    if (limitStr) {
      const limit = parseInt(limitStr, 10);
      list = list.slice(0, limit);
    }

    return list as T;
  }

  async execute(sql: string, params: any[] = []): Promise<void> {
    if (typeof window === 'undefined') return;

    console.log(`[LocalStorageConnection] Execute: ${sql}`, params);
    const normalized = this.normalizeSql(sql);

    // 1. INSERT
    const insertMatch = normalized.match(/^insert\s+into\s+([a-zA-Z0-9_]+)\s*\((.+?)\)\s*values\s*\((.+?)\)$/i);
    if (insertMatch) {
      const [, tableName, colsStr, valsStr] = insertMatch;
      const columns = colsStr.split(',').map(s => s.trim());
      const values = this.parseValuesClause(valsStr, params);
      
      const storeKey = `basekit_db_table_${tableName}`;
      const data = localStorage.getItem(storeKey);
      const list = data ? JSON.parse(data) : [];

      const item: Record<string, any> = {};
      columns.forEach((col, idx) => {
        item[col] = values[idx];
      });

      const record = {
        id: item.id || crypto.randomUUID(),
        ...item,
        created_at: item.created_at || new Date().toISOString()
      };

      list.push(record);
      localStorage.setItem(storeKey, JSON.stringify(list));
      this.writeAuditLog('INSERT', tableName, {}, record);
      return;
    }

    // 2. UPDATE
    const updateMatch = normalized.match(/^update\s+([a-zA-Z0-9_]+)\s+set\s+(.+?)(?:\s+where\s+(.+?))?$/i);
    if (updateMatch) {
      const [, tableName, setStr, whereStr] = updateMatch;
      const updateFields = this.parseSetClause(setStr, params);
      const conditions = this.parseWhereClause(whereStr, params);

      const storeKey = `basekit_db_table_${tableName}`;
      const data = localStorage.getItem(storeKey);
      const list: any[] = data ? JSON.parse(data) : [];

      let updatedAny = false;
      const newList = list.map(item => {
        if (this.evaluateConditions(item, conditions)) {
          updatedAny = true;
          const oldVal = { ...item };
          const newVal = { ...item, ...updateFields };
          
          const isLogicalDelete = updateFields.deleted_at !== undefined && updateFields.deleted_at !== null;
          const action = isLogicalDelete ? 'DELETE (LOGICAL)' : 'UPDATE';
          
          this.writeAuditLog(action, tableName, oldVal, newVal);
          return newVal;
        }
        return item;
      });

      if (updatedAny) {
        localStorage.setItem(storeKey, JSON.stringify(newList));
      }
      return;
    }

    // 3. DELETE
    const deleteMatch = normalized.match(/^delete\s+from\s+([a-zA-Z0-9_]+)(?:\s+where\s+(.+?))?$/i);
    if (deleteMatch) {
      const [, tableName, whereStr] = deleteMatch;
      const conditions = this.parseWhereClause(whereStr, params);

      const storeKey = `basekit_db_table_${tableName}`;
      const data = localStorage.getItem(storeKey);
      const list: any[] = data ? JSON.parse(data) : [];

      const remainingList: any[] = [];
      for (const item of list) {
        if (this.evaluateConditions(item, conditions)) {
          this.writeAuditLog('DELETE (PHYSICAL)', tableName, item, {});
        } else {
          remainingList.push(item);
        }
      }

      localStorage.setItem(storeKey, JSON.stringify(remainingList));
      return;
    }

    // Fallback: core's very naive matching for backward compatibility
    const fallbackInsert = normalized.match(/insert\s+into\s+([a-zA-Z0-9_]+)/i);
    const fallbackDelete = normalized.match(/delete\s+from\s+([a-zA-Z0-9_]+)/i);
    const fallbackUpdate = normalized.match(/update\s+([a-zA-Z0-9_]+)/i);

    if (fallbackInsert) {
      const tableName = fallbackInsert[1];
      const storeKey = `basekit_db_table_${tableName}`;
      const data = localStorage.getItem(storeKey);
      const list = data ? JSON.parse(data) : [];
      const newItem = params ? params[0] : {};
      const record = { id: crypto.randomUUID(), ...newItem, created_at: new Date().toISOString() };
      list.push(record);
      localStorage.setItem(storeKey, JSON.stringify(list));
      this.writeAuditLog('INSERT', tableName, {}, record);
    } else if (fallbackDelete) {
      const tableName = fallbackDelete[1];
      const storeKey = `basekit_db_table_${tableName}`;
      localStorage.removeItem(storeKey);
      this.writeAuditLog('DELETE (PHYSICAL)', tableName, {}, {});
    } else if (fallbackUpdate) {
      const tableName = fallbackUpdate[1];
      const storeKey = `basekit_db_table_${tableName}`;
      const data = localStorage.getItem(storeKey);
      const list: any[] = data ? JSON.parse(data) : [];
      const updatedItem = params ? params[0] : {};
      let oldVal = {};
      if (updatedItem && updatedItem.id) {
        const found = list.find((item: any) => item.id === updatedItem.id);
        if (found) oldVal = found;
      }
      const isLogicalDelete = updatedItem && updatedItem.deleted_at !== undefined && updatedItem.deleted_at !== null;
      const action = isLogicalDelete ? 'DELETE (LOGICAL)' : 'UPDATE';
      this.writeAuditLog(action, tableName, oldVal, updatedItem);
    }
  }

  async close(): Promise<void> {}
}
