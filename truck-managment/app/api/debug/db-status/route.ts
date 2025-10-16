import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    // check basic connectivity
    await prisma.$queryRaw`SELECT 1`;

    // check if Package table exists (Postgres and SQLite compatible query)
    let hasPackageTable = false;
    try {
      const res: any = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as c FROM information_schema.tables WHERE table_name ILIKE 'package'`
      );
      if (res && Array.isArray(res) && res.length > 0) {
        const c = parseInt(res[0].c || res[0].count || res[0].C || 0, 10);
        hasPackageTable = c > 0;
      }
    } catch (e) {
      // fallback for SQLite (no information_schema)
      try {
        const sqliteRes: any = await prisma.$queryRawUnsafe(`SELECT name FROM sqlite_master WHERE type='table' AND lower(name)='package'`);
        hasPackageTable = Array.isArray(sqliteRes) && sqliteRes.length > 0;
      } catch (e2) {
        // ignore
      }
    }

    return NextResponse.json({ ok: true, hasPackageTable });
  } catch (error: any) {
    console.error('GET /api/debug/db-status error:', error);
    return NextResponse.json({ ok: false, error: String(error?.message || error) }, { status: 500 });
  }
}
