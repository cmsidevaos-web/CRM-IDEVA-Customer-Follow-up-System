import { supabase } from '../services/supabaseClient';
import { AppUser } from '../types';
import { INITIAL_USERS, DEFAULT_PERMISSIONS } from '../data/defaultUsers';

export function userToDb(u: AppUser) {
  const fullName = (u.name && u.name.trim() !== '')
    ? u.name.trim()
    : `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.username;

  return {
    id: String(u.id || `USER-${Date.now()}`),
    username: String(u.username || '').trim().toLowerCase(),
    password: String(u.password || '123456'),
    name: fullName,
    role: String(u.role || 'SALES'),
    position: u.position || 'เจ้าหน้าที่ฝ่ายขาย',
    department: u.department || 'ฝ่ายขายและการตลาด (Sales)',
    email: u.email || `${u.username || 'user'}@ideva.co.th`,
    phone: u.phone || null,
    avatar_url: u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: String(u.status || 'ACTIVE'),
    sales_owner_tag: u.salesOwnerTag || (u.role === 'SALES' ? fullName : 'ALL'),
    permissions: u.permissions || DEFAULT_PERMISSIONS[u.role] || DEFAULT_PERMISSIONS.SALES,
    created_at: u.createdAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export function userFromDb(row: any): AppUser {
  const role = (row.role || 'SALES') as AppUser['role'];
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

  const fullName = row.name || row.full_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.username || 'User';
  const nameParts = fullName.split(' ');
  const firstName = row.first_name || nameParts[0] || '';
  const lastName = row.last_name || nameParts.slice(1).join(' ') || '';

  return {
    id: String(row.id || `USER-${Date.now()}`),
    username: row.username || row.user_login || '',
    password: row.password || row.password_hash || '123456',
    firstName,
    lastName,
    name: fullName,
    email: row.email || `${row.username || 'user'}@ideva.co.th`,
    phone: row.phone || '',
    position: row.position || 'เจ้าหน้าที่ฝ่ายขาย',
    department: row.department || 'ฝ่ายขายและการตลาด (Sales)',
    avatarUrl: row.avatar_url || row.avatarUrl || row.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: role,
    status: (row.status || 'ACTIVE') as AppUser['status'],
    salesOwnerTag: row.sales_owner_tag || row.salesOwnerTag || (role === 'SALES' ? fullName : 'ALL'),
    permissions: parsedPermissions,
    createdAt: row.created_at || new Date().toISOString().split('T')[0],
    updatedAt: row.updated_at || new Date().toISOString().split('T')[0],
    lastLoginAt: row.last_login_at || undefined,
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
    // If we already detected the table does not exist in Supabase, use resilient local store
    if (this.isTableAvailable === false) {
      return { users: this.inMemoryUsers, fromSupabase: false, tableMissing: true };
    }

    try {
      const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: true });
      if (error) {
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
      if (isTableMissingError(err)) {
        this.isTableAvailable = false;
        return { users: this.inMemoryUsers, fromSupabase: false, tableMissing: true };
      }
      return { users: this.inMemoryUsers, fromSupabase: false, error: err?.message };
    }
  }

  async findById(id: string): Promise<AppUser | null> {
    if (this.isTableAvailable !== false) {
      try {
        const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
        if (error) {
          if (isTableMissingError(error)) {
            this.isTableAvailable = false;
          }
        } else if (data) {
          return userFromDb(data);
        }
      } catch (e: any) {
        if (isTableMissingError(e)) {
          this.isTableAvailable = false;
        }
      }
    }

    return this.inMemoryUsers.find((u) => u.id === id) || null;
  }

  async findByUsername(username: string): Promise<AppUser | null> {
    const cleanUsername = username.trim().toLowerCase();

    if (this.isTableAvailable !== false) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .ilike('username', cleanUsername)
          .maybeSingle();

        if (error) {
          if (isTableMissingError(error)) {
            this.isTableAvailable = false;
          }
        } else if (data) {
          return userFromDb(data);
        }
      } catch (e: any) {
        if (isTableMissingError(e)) {
          this.isTableAvailable = false;
        }
      }
    }

    return (
      this.inMemoryUsers.find(
        (u) => u.username.toLowerCase() === cleanUsername || (u.email && u.email.toLowerCase() === cleanUsername)
      ) || null
    );
  }

  async save(user: AppUser): Promise<AppUser> {
    const dbRow = userToDb(user);

    // Update in-memory first for instant UI response and local persistence
    const existingIdx = this.inMemoryUsers.findIndex(
      (u) => u.id === user.id || u.username.toLowerCase() === user.username.toLowerCase()
    );
    if (existingIdx >= 0) {
      this.inMemoryUsers[existingIdx] = { ...this.inMemoryUsers[existingIdx], ...user };
    } else {
      this.inMemoryUsers.push(user);
    }
    persistStoredUsers(this.inMemoryUsers);

    // If table is known to be missing in Supabase, return directly without error
    if (this.isTableAvailable === false) {
      return user;
    }

    try {
      const { data, error } = await supabase.from('users').upsert(dbRow, { onConflict: 'id' }).select().single();
      if (error) {
        if (isTableMissingError(error)) {
          this.isTableAvailable = false;
        }
        return user;
      }
      this.isTableAvailable = true;
      return userFromDb(data || dbRow);
    } catch (err: any) {
      if (isTableMissingError(err)) {
        this.isTableAvailable = false;
      }
      return user;
    }
  }

  async delete(id: string): Promise<boolean> {
    this.inMemoryUsers = this.inMemoryUsers.filter((u) => u.id !== id);
    persistStoredUsers(this.inMemoryUsers);

    if (this.isTableAvailable === false) {
      return true;
    }

    try {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error && isTableMissingError(error)) {
        this.isTableAvailable = false;
      }
      return true;
    } catch (err: any) {
      if (isTableMissingError(err)) {
        this.isTableAvailable = false;
      }
      return true;
    }
  }

  async seedBatch(users: AppUser[]): Promise<{ success: boolean; error?: string }> {
    // Merge into local cache
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
        if (isTableMissingError(error)) {
          this.isTableAvailable = false;
          return { success: false, error: 'TABLE_MISSING' };
        }
        return { success: false, error: error.message };
      }
      this.isTableAvailable = true;
      return { success: true };
    } catch (e: any) {
      if (isTableMissingError(e)) {
        this.isTableAvailable = false;
        return { success: false, error: 'TABLE_MISSING' };
      }
      return { success: false, error: e?.message };
    }
  }
}

export const userRepository = new UserRepository();
