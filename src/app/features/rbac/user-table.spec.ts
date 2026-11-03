import { User } from '../../core/models/user.model';
import { filterAndSortUsers, isPendingApproval, UserTableState } from './user-table';

describe('filterAndSortUsers', () => {
  const users: User[] = [
    { id: 1, username: 'ADMIN', first_name: 'Ada', last_name: 'Admin', department: 'IT Security', email: 'ada@example.com', is_active: true },
    { id: 2, username: 'Q225265', first_name: 'Max', last_name: 'Mustermann', department: 'Finance', email: null, is_active: true },
    { id: 3, username: 'PENDING', first_name: 'Paula', last_name: 'Zeta', department: null, email: 'paula@example.com', is_active: false },
    { id: 4, username: 'LOADING', first_name: 'Lou', last_name: 'Berg', department: 'it security', email: null, is_active: true },
  ];
  const roles: Record<number, string[] | null> = { 1: ['ADMIN', 'USER'], 2: ['VIEWER'], 3: [], 4: null };
  const roleNames = (id: number) => roles[id];
  const base: UserTableState = { search: '', status: 'all', role: 'all', sortKey: 'id', sortDirection: 'asc' };
  const ids = (state: Partial<UserTableState>) => filterAndSortUsers(users, roleNames, { ...base, ...state }).map(u => u.id);

  it('returns all users sorted by id by default', () => {
    expect(ids({})).toEqual([1, 2, 3, 4]);
  });

  it('searches username, names, department and e-mail case-insensitively', () => {
    expect(ids({ search: 'q2252' })).toEqual([2]);
    expect(ids({ search: 'MUSTER' })).toEqual([2]);
    expect(ids({ search: '  it security ' })).toEqual([1, 4]);
    expect(ids({ search: 'paula@' })).toEqual([3]);
    expect(ids({ search: 'nobody' })).toEqual([]);
  });

  it('filters by status', () => {
    expect(ids({ status: 'active' })).toEqual([1, 2, 4]);
    expect(ids({ status: 'inactive' })).toEqual([3]);
  });

  it('filters by role and excludes users whose roles are not known', () => {
    expect(ids({ role: 'USER' })).toEqual([1]);
    expect(ids({ role: 'VIEWER' })).toEqual([2]);
    expect(ids({ role: 'none' })).toEqual([3]);
  });

  it('treats inactive users without roles as pending approval', () => {
    expect(isPendingApproval(users[2], [])).toBe(true);
    expect(isPendingApproval(users[2], ['VIEWER'])).toBe(false);
    expect(isPendingApproval(users[2], null)).toBe(false);
    expect(isPendingApproval(users[0], [])).toBe(false);
    expect(ids({ status: 'pending' })).toEqual([3]);
  });

  it('combines search, status and role filters', () => {
    expect(ids({ search: 'example.com', status: 'active', role: 'ADMIN' })).toEqual([1]);
  });

  it('sorts text columns case-insensitively in both directions', () => {
    expect(ids({ sortKey: 'last_name' })).toEqual([1, 4, 2, 3]);
    expect(ids({ sortKey: 'last_name', sortDirection: 'desc' })).toEqual([3, 2, 4, 1]);
  });

  it('puts empty values last in both directions', () => {
    expect(ids({ sortKey: 'email' })).toEqual([1, 3, 2, 4]);
    expect(ids({ sortKey: 'email', sortDirection: 'desc' })).toEqual([3, 1, 2, 4]);
    expect(ids({ sortKey: 'roles' })).toEqual([1, 2, 3, 4]);
  });

  it('sorts by active state', () => {
    expect(ids({ sortKey: 'is_active' })).toEqual([3, 1, 2, 4]);
  });
});
