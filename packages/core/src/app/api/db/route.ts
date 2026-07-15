import { NextResponse } from 'next/server';
import { Client } from 'pg';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, sql, params, config } = body;

    const host = config?.host || process.env.DB_HOST || 'localhost';
    const port = config?.port || parseInt(process.env.DB_PORT || '5432', 10);
    const database = config?.database || process.env.DB_NAME || 'postgres';
    const user = config?.user || process.env.DB_USER || 'postgres';
    const password = config?.password || process.env.DB_PASSWORD || '';
    const ssl = config?.ssl || process.env.DB_SSL === 'true';

    const client = new Client({
      host,
      port,
      database,
      user,
      password,
      ssl: ssl ? { rejectUnauthorized: false } : false
    });

    await client.connect();

    try {
      if (action === 'test') {
        const result = await client.query('SELECT 1 as connected;');
        return NextResponse.json({ success: true, message: '接続テスト成功', result: result.rows });
      } else if (action === 'query') {
        const result = await client.query(sql, params);
        return NextResponse.json({ success: true, rows: result.rows });
      } else if (action === 'execute') {
        await client.query(sql, params);
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ success: false, error: `Invalid action: ${action}` }, { status: 400 });
      }
    } finally {
      await client.end();
    }
  } catch (err: any) {
    console.error('[DB Proxy API] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
