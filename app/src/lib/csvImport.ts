import { isValidPhone } from '@/lib/phoneAuth';

export interface CsvMemberRow {
  name: string;
  phone: string;
  email?: string;
  role?: string;
}

export interface ParseResult {
  valid: CsvMemberRow[];
  errors: Array<{ row: number; field: string; message: string }>;
  totalRows: number;
}

function normaliseRole(raw: string | undefined): string {
  const lower = (raw ?? '').trim().toLowerCase();
  if (lower === 'admin' || lower === 'treasurer') return lower;
  return 'member';
}

function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function parseCsvMembers(csvText: string): ParseResult {
  const lines = csvText.split(/\r?\n/);
  const errors: ParseResult['errors'] = [];
  const valid: CsvMemberRow[] = [];

  const headerLine = lines[0]?.trim();
  if (!headerLine) {
    return { valid: [], errors: [{ row: 0, field: 'header', message: 'CSV is empty or missing header row' }], totalRows: 0 };
  }

  const headers = splitCsvLine(headerLine).map((h) => h.toLowerCase());
  const nameIdx = headers.indexOf('name');
  const phoneIdx = headers.indexOf('phone') !== -1 ? headers.indexOf('phone') : headers.indexOf('mobile');
  const emailIdx = headers.indexOf('email');
  const roleIdx = headers.indexOf('role');

  if (nameIdx === -1) {
    return { valid: [], errors: [{ row: 1, field: 'name', message: 'Missing required "name" column in header' }], totalRows: 0 };
  }
  if (phoneIdx === -1) {
    return { valid: [], errors: [{ row: 1, field: 'phone', message: 'Missing required "phone" or "mobile" column in header' }], totalRows: 0 };
  }

  let totalRows = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;

    totalRows++;
    const rowNum = i + 1;
    const fields = splitCsvLine(line);

    const name = (fields[nameIdx] ?? '').trim();
    const phone = (fields[phoneIdx] ?? '').trim();
    const email = emailIdx !== -1 ? (fields[emailIdx] ?? '').trim() || undefined : undefined;
    const role = normaliseRole(roleIdx !== -1 ? fields[roleIdx] : undefined);

    let rowHasError = false;

    if (!name) {
      errors.push({ row: rowNum, field: 'name', message: 'Name is required' });
      rowHasError = true;
    }

    if (!phone) {
      errors.push({ row: rowNum, field: 'phone', message: 'Phone is required' });
      rowHasError = true;
    } else if (!isValidPhone(phone)) {
      errors.push({ row: rowNum, field: 'phone', message: `Invalid phone number: "${phone}"` });
      rowHasError = true;
    }

    if (!rowHasError) {
      const row: CsvMemberRow = { name, phone, role };
      if (email) row.email = email;
      valid.push(row);
    }
  }

  return { valid, errors, totalRows };
}

export function csvMembersToText(members: CsvMemberRow[]): string {
  const header = 'name,phone,email,role';
  const rows = members.map((m) => {
    const name = m.name.includes(',') ? `"${m.name}"` : m.name;
    const phone = m.phone;
    const email = m.email ?? '';
    const role = m.role ?? 'member';
    return `${name},${phone},${email},${role}`;
  });
  return [header, ...rows].join('\n');
}

export const SAMPLE_CSV_TEMPLATE = `name,phone,email,role
Jane Wanjiku,+254712345678,jane@example.com,admin
John Kamau,0723456789,,member`;
