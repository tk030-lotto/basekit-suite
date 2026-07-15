import { Client } from 'pg';

let isAuditSetupDone = false;

export async function setupPostgresAuditLogs(client: Client): Promise<void> {
  if (isAuditSetupDone) return;

  try {
    console.log('[postgresSetup] Setting up PostgreSQL audit logs & triggers...');

    // 1. Create audit_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(20) NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        old_value JSONB,
        new_value JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Create trigger function with logical delete detection
    // Using jsonb operators (? and ->>) to safely handle tables with/without deleted_at
    await client.query(`
      CREATE OR REPLACE FUNCTION audit_trigger_func()
      RETURNS TRIGGER AS $$
      DECLARE
          action_type VARCHAR(20);
          old_json JSONB;
          new_json JSONB;
      BEGIN
          IF (TG_OP = 'INSERT') THEN
              action_type := 'INSERT';
              INSERT INTO audit_logs (action, table_name, old_value, new_value)
              VALUES (action_type, TG_TABLE_NAME, NULL, row_to_json(NEW)::jsonb);
              RETURN NEW;
          ELSIF (TG_OP = 'UPDATE') THEN
              old_json := to_jsonb(OLD);
              new_json := to_jsonb(NEW);
              
              -- Safely check if deleted_at transitioned from NULL to non-NULL
              IF (old_json ? 'deleted_at' AND new_json ? 'deleted_at') THEN
                  IF ((old_json ->> 'deleted_at') IS NULL AND (new_json ->> 'deleted_at') IS NOT NULL) THEN
                      action_type := 'DELETE (LOGICAL)';
                  ELSE
                      action_type := 'UPDATE';
                  END IF;
              ELSE
                  action_type := 'UPDATE';
              END IF;
              
              INSERT INTO audit_logs (action, table_name, old_value, new_value)
              VALUES (action_type, TG_TABLE_NAME, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
              RETURN NEW;
          ELSIF (TG_OP = 'DELETE') THEN
              action_type := 'DELETE (PHYSICAL)';
              INSERT INTO audit_logs (action, table_name, old_value, new_value)
              VALUES (action_type, TG_TABLE_NAME, row_to_json(OLD)::jsonb, NULL);
              RETURN OLD;
          END IF;
          RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // 3. Attach triggers to all public tables (excluding audit_logs itself)
    await client.query(`
      DO $$
      DECLARE
          r RECORD;
      BEGIN
          FOR r IN 
              SELECT table_name 
              FROM information_schema.tables 
              WHERE table_schema = 'public' 
                AND table_type = 'BASE TABLE'
                AND table_name != 'audit_logs'
          LOOP
              IF NOT EXISTS (
                  SELECT 1 FROM information_schema.triggers 
                  WHERE event_object_table = r.table_name 
                    AND trigger_name = 'trg_audit_' || r.table_name
              ) THEN
                  EXECUTE format('
                      CREATE TRIGGER %I
                      AFTER INSERT OR UPDATE OR DELETE ON %I
                      FOR EACH ROW EXECUTE FUNCTION audit_trigger_func()',
                      'trg_audit_' || r.table_name, r.table_name);
              END IF;
          END LOOP;
      END;
      $$;
    `);

    isAuditSetupDone = true;
    console.log('[postgresSetup] PostgreSQL audit logs setup completed successfully.');
  } catch (error) {
    console.error('[postgresSetup] Failed to set up PostgreSQL audit logs:', error);
  }
}
