// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

import { User } from '../../core/models/user.model';

export type SortKey = 'id' | 'username' | 'first_name' | 'last_name' | 'department' | 'email' | 'roles' | 'is_active';
export type SortDirection = 'asc' | 'desc';
export type StatusFilter = 'all' | 'active' | 'inactive';
/** `all`, `none` (users without a role) or an upper-case role name. */
export type RoleFilter = string;

export interface UserTableState {
  search: string;
  status: StatusFilter;
  role: RoleFilter;
  sortKey: SortKey;
  sortDirection: SortDirection;
}

/**
 * Filters and sorts the users of the User Management table.
 * `roleNames` maps a user id to its role names, or `null` while the roles are loading or unreadable;
 * such users never match a role filter.
 */
export function filterAndSortUsers(
  users: User[],
  roleNames: (userId: number) => string[] | null,
  state: UserTableState,
): User[] {
  const term = state.search.trim().toLowerCase();
  const filtered = users.filter(u => {
    if (state.status === 'active' && !u.is_active) return false;
    if (state.status === 'inactive' && u.is_active) return false;
    if (state.role !== 'all') {
      const names = roleNames(u.id);
      if (names === null) return false;
      if (state.role === 'none' ? names.length > 0 : !names.includes(state.role)) return false;
    }
    if (!term) return true;
    return [u.username, u.first_name, u.last_name, u.department, u.email]
      .some(v => (v ?? '').toLowerCase().includes(term));
  });

  const value = (u: User): string | number | null => {
    switch (state.sortKey) {
      case 'id': return u.id;
      case 'is_active': return u.is_active ? 1 : 0;
      case 'roles': {
        const names = roleNames(u.id);
        return names && names.length ? names.join(', ') : null;
      }
      default: return u[state.sortKey] || null;
    }
  };
  const factor = state.sortDirection === 'asc' ? 1 : -1;

  return [...filtered].sort((a, b) => {
    const va = value(a);
    const vb = value(b);
    // Empty values always go last, independent of the direction.
    if (va === null || vb === null) return va === vb ? a.id - b.id : va === null ? 1 : -1;
    const cmp = typeof va === 'number' && typeof vb === 'number'
      ? va - vb
      : String(va).localeCompare(String(vb), undefined, { sensitivity: 'base', numeric: true });
    return cmp !== 0 ? cmp * factor : a.id - b.id;
  });
}
