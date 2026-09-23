import { supabase } from '../services/supabaseClient';
import { AppUser } from '../types';
import { INITIAL_USERS, DEFAULT_PERMISSIONS } from '../data/defaultUsers';

export function userToDb(u: AppUser | any) {
  const firstName = String(u.firstName || u.first_name || '').trim();
  const lastName = String(u.lastName || u.last_name || '').trim();
  const fullName = (u.name && String(u.name).trim() !== '')
    ? String(u.name).trim()
    : (u.full_name || `${firstName} ${lastName}`.trim() || u.username || 'User');
  const username = String(u.username || u.user_login || '').trim().toLowerCase();
  const password = String(u.password || '123456');
  const avatar = u.avatarUrl || u.avatar_url || u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
  const telegramChatId = u.telegramChatId || u.telegram_chat_id || '';
  const telegramConnected = u.telegramConnected !== undefined ? Boolean(u.telegramConnected) : (u.telegram_connected !== undefined ? Boolean(u.telegram_connected) : Boolean(telegramChatId));

  return {
    id: String(u.id || `USER-${Date.now()}`),
    sales_id: u.salesId || u.sales_id || (u.id ? String(u.id).replace('USER-', 'SALE_') : null),
    username: username,
    password: password,
    name: fullName,
    role: String(u.role || 'SALES'),
    position: u.position || 'เจ้าหน้าที่ฝ่ายขาย',
    department: u.department || 'ฝ่ายขายและการตลาด (Sales)',
    email: u.email || `${username}@ideva.co.th`,
    phone: u.phone || null,
    avatar_url: avatar,
    status: String(u.status || 'ACTIVE'),
    sales_owner_tag: u.salesOwnerTag || u.sales_owner_tag || (u.role === 'SALES' ? fullName : 'ALL'),
    telegram_chat_id: telegramChatId || null,
    telegram_connected: telegramConnected,
    telegram_username: u.telegramUsername || u.telegram_username || null,
    permissions: u.permissions || (u.role ? DEFAULT_PERMISSIONS[u.role as keyof typeof DEFAULT_PERMISSIONS] : DEFAULT_PERMISSIONS.SALES),
    created_at: u.createdAt || u.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function userFromDb(row: any): AppUser {
  const roleRaw = (row.role || 'SALES').toUpperCase();
  const role: AppUser['role'] = (['MASTER_ADMIN', 'ADMIN', 'SALES', 'VIEWER'].includes(roleRaw)
    ? roleRaw
    : 'SALES') as AppUser['role'];

  const basePermissions = DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.SALES;

  let parsedPermissions = basePermissions;
  if (row.permissions) {
    if (typeof row.permissions === 'object') {
      parsedPermissions = { ...basePermissions, ...row.permissions };
    } else if (typeof row.permissions === 'string') {
      try {
        parsedPermissions = { ...basePermissions, ...JSON.parse(row.permissions) };
      } catch (e) {
        parsedPermissions = basePermissions;
      }
    }
  }

  const fullName = row.name || row.full_name || row.fullName || `${row.first_name || row.firstName || ''} ${row.last_name || row.lastName || ''}`.trim() || row.username || row.user_login || 'User';
  const nameParts = fullName.split(' ');
  const firstName = row.first_name || row.firstName || nameParts[0] || '';
  const lastName = row.last_name || row.lastName || nameParts.slice(1).join(' ') || '';

  const statusRaw = (row.status || 'ACTIVE').toUpperCase();
  const status: AppUser['status'] = (statusRaw === 'INACTIVE' || statusRaw === 'SUSPENDED' ? statusRaw : 'ACTIVE') as AppUser['status'];

  const telegramChatId = row.telegram_chat_id || row.telegramChatId || '';
  const telegramConnected = row.telegram_connected !== undefined ? Boolean(row.telegram_connected) : (row.telegramConnected !== undefined ? Boolean(row.telegramConnected) : Boolean(telegramChatId));

  return {
    id: String(row.id || `USER-${Date.now()}`),
    salesId: row.sales_id || row.salesId || (row.id ? String(row.id).replace('USER-', 'SALE_') : undefined),
    username: row.username || row.user_login || row.user || row.login || '',
    password: row.password || row.password_hash || row.pass || '123456',
    firstName,
    lastName,
    name: fullName,
    email: row.email || row.user_email || `${row.username || row.user_login || 'user'}@ideva.co.th`,
    phone: row.phone || row.tel || row.telephone || '',
    position: row.position || row.job_title || 'เจ้าหน้าที่ฝ่ายขาย',
    department: row.department || row.dept || 'ฝ่ายขายและการตลาด (Sales)',
    avatarUrl: row.avatar_url || row.avatarUrl || row.avatar || row.image_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: role,
    status: status,
    salesOwnerTag: row.sales_owner_tag || row.salesOwnerTag || row.sales_owner || (role === 'SALES' ? fullName : 'ALL'),
    telegramChatId: telegramChatId || undefined,
    telegramConnected: telegramConnected,
    telegramUsername: row.telegram_username || row.telegramUsername || undefined,
    permissions: parsedPermissions,
    createdAt: row.created_at || row.createdAt || new Date().toISOString().split('T')[0],
    updatedAt: row.updated_at || row.updatedAt || new Date().toISOString().split('T')[0],
    lastLoginAt: row.last_login_at || row.lastLoginAt || undefined,
  };
}

export function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === 'string' ? error : error.message || error.details || error.hint || '';
  const code = error.code || '';
  return (
    code === 'PGRST205' ||
    code === 'PGRST125' ||
    code === '42P01' ||
    msg.includes('Could not find the table') ||
    msg.includes('schema cache') ||
    (msg.includes('relation') && msg.includes('does not exist')) ||
    msg.includes('Invalid path') ||
    msg.includes('404')
  );
}

function extractMissingColumn(error: any): string | null {
  if (!error) return null;
  const msg = error.message || error.details || error.hint || '';
  const match1 = msg.match(/Could not find the '([^']+)' column/i);
  if (match1 && match1[1]) return match1[1];
  const match2 = msg.match(/column "?([^" ]+)"? of relation/i);
  if (match2 && match2[1]) return match2[1];
  const match3 = msg.match(/column [^.]+\.([^ ]+) does not exist/i);
  if (match3 && match3[1]) return match3[1];
  return null;
}

const USERS_CACHE_KEY = 'ideva_crm_users_cache';

function getStoredUsers(): AppUser[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(USERS_CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
  }
  return [...INITIAL_USERS];
}

function persistStoredUsers(users: AppUser[]): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(USERS_CACHE_KEY, JSON.stringify(users));
    } catch (e) {}
  }
}

export class UserRepository {
  private inMemoryUsers: AppUser[] = getStoredUsers();
  private isTableAvailable: boolean | null = null;

  resetTableState(): void {
    this.isTableAvailable = null;
  }

  getTableAvailable(): boolean | null {
    return this.isTableAvailable;
  }

  async find(): Promise<{ users: AppUser[]; fromSupabase: boolean; tableMissing?: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('[UserRepository.find Supabase warning]:', error.message, error.code);
        if (isTableMissingError(error)) {
          this.isTableAvailable = false;
          return { users: this.inMemoryUsers, fromSupabase: false, tableMissing: true };
        }
        return { users: this.inMemoryUsers, fromSupabase: false, error: error.message };
      }

      this.isTableAvailable = true;

      if (!data || data.length === 0) {
        // Table exists but is empty -> seed initial users
        await this.seedBatch(INITIAL_USERS);
        return { users: this.inMemoryUsers, fromSupabase: true };
      }

      const mapped = data.map(userFromDb);
      this.inMemoryUsers = mapped;
      persistStoredUsers(mapped);
      return { users: mapped, fromSupabase: true };
    } catch (err: any) {
      console.warn('[UserRepository.find exception]:', err);
      if (isTableMissingError(err)) {
        this.isTableAvailable = false;
        return { users: this.inMemoryUsers, fromSupabase: false, tableMissing: true };
      }
      return { users: this.inMemoryUsers, fromSupabase: false, error: err?.message };
    }
  }

  async findById(id: string): Promise<AppUser | null> {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
      if (!error && data) {
        return userFromDb(data);
      }
    } catch (e: any) {}

    return this.inMemoryUsers.find((u) => u.id === id) || null;
  }

  async findByUsername(username: string): Promise<AppUser | null> {
    const cleanUsername = username.trim().toLowerCase();

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.${cleanUsername},user_login.ilike.${cleanUsername},email.ilike.${cleanUsername}`)
        .maybeSingle();

      if (!error && data) {
        return userFromDb(data);
      }
    } catch (e: any) {}

    return (
      this.inMemoryUsers.find(
        (u) => u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanUsername)
      ) || null
    );
  }

  async save(user: AppUser): Promise<AppUser> {
    let dbRow: Record<string, any> = userToDb(user);

    // Update in-memory first for immediate responsive UI
    const existingIdx = this.inMemoryUsers.findIndex(
      (u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase()
    );
    if (existingIdx >= 0) {
      this.inMemoryUsers[existingIdx] = { ...this.inMemoryUsers[existingIdx], ...user };
    } else {
      this.inMemoryUsers.push(user);
    }
    persistStoredUsers(this.inMemoryUsers);

    // Attempt to save to Supabase with automatic schema adaptation and retry loop
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // 1. Try Upsert with onConflict on 'id'
        const { data, error } = await supabase
          .from('users')
          .upsert(dbRow, { onConflict: 'id' })
          .select();

        if (!error && data && data.length > 0) {
          this.isTableAvailable = true;
          const saved = userFromDb(data[0]);
          if (existingIdx >= 0) {
            this.inMemoryUsers[existingIdx] = saved;
          }
          persistStoredUsers(this.inMemoryUsers);
          return saved;
        }

        if (error) {
          const missingCol = extractMissingColumn(error);
          if (missingCol && missingCol in dbRow) {
            delete dbRow[missingCol];
            continue; // retry without the missing column
          }

          // 2. If upsert returned error, try direct Update
          const { data: updateData, error: updateError } = await supabase
            .from('users')
            .update(dbRow)
            .eq('id', user.id)
            .select();

          if (!updateError && updateData && updateData.length > 0) {
            this.isTableAvailable = true;
            const saved = userFromDb(updateData[0]);
            if (existingIdx >= 0) {
              this.inMemoryUsers[existingIdx] = saved;
            }
            persistStoredUsers(this.inMemoryUsers);
            return saved;
          }

          if (updateError) {
            const updCol = extractMissingColumn(updateError);
            if (updCol && updCol in dbRow) {
              delete dbRow[updCol];
              continue;
            }
          }

          // 3. If update returned empty (row does not exist yet), try Insert
          const { data: insertData, error: insertError } = await supabase
            .from('users')
            .insert(dbRow)
            .select();

          if (!insertError && insertData && insertData.length > 0) {
            this.isTableAvailable = true;
            const saved = userFromDb(insertData[0]);
            if (existingIdx >= 0) {
              this.inMemoryUsers[existingIdx] = saved;
            }
            persistStoredUsers(this.inMemoryUsers);
            return saved;
          }

          if (insertError) {
            const insCol = extractMissingColumn(insertError);
            if (insCol && insCol in dbRow) {
              delete dbRow[insCol];
              continue;
            }
            console.warn('[UserRepository.save Supabase notice]:', error.message || updateError?.message || insertError.message);
          }
        }
      } catch (err: any) {
        console.warn('[UserRepository.save exception]:', err);
      }
      break;
    }

    return user;
  }

  async delete(id: string): Promise<boolean> {
    this.inMemoryUsers = this.inMemoryUsers.filter((u) => u.id !== id);
    persistStoredUsers(this.inMemoryUsers);

    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) {
        console.warn('[UserRepository.delete Supabase error]:', error.message);
      }
      return true;
    } catch (err: any) {
      console.warn('[UserRepository.delete exception]:', err);
      return true;
    }
  }

  async seedBatch(users: AppUser[]): Promise<{ success: boolean; error?: string }> {
    for (const u of users) {
      const idx = this.inMemoryUsers.findIndex(
        (x) => x.id === u.id || x.username.toLowerCase() === u.username.toLowerCase()
      );
      if (idx >= 0) {
        this.inMemoryUsers[idx] = { ...this.inMemoryUsers[idx], ...u };
      } else {
        this.inMemoryUsers.push(u);
      }
    }
    persistStoredUsers(this.inMemoryUsers);

    const rows = users.map(userToDb);
    try {
      const { error } = await supabase.from('users').upsert(rows, { onConflict: 'id' });
      if (error) {
        console.warn('[UserRepository.seedBatch error]:', error.message);
        if (isTableMissingError(error)) {
          this.isTableAvailable = false;
          return { success: false, error: 'TABLE_MISSING' };
        }
        return { success: false, error: error.message };
      }
      this.isTableAvailable = true;
      return { success: true };
    } catch (e: any) {
      console.warn('[UserRepository.seedBatch exception]:', e);
      if (isTableMissingError(e)) {
        this.isTableAvailable = false;
        return { success: false, error: 'TABLE_MISSING' };
      }
      return { success: false, error: e?.message };
    }
  }
}

export const userRepository = new UserRepository();


