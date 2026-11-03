import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { toast } from '@spartan-ng/brain/sonner';
import { CommonModule } from '@angular/common';
import { RbacService } from '../../core/services/rbac.service';
import { AuthService } from '../../core/auth/auth.service';
import { Role, User } from '../../core/models/user.model';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { BrnDialogImports } from '@spartan-ng/brain/dialog';
import { ConfirmService } from '../../core/confirm/confirm.service';
import { UserEditorDialogComponent } from './components/user-editor-dialog/user-editor-dialog.component';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { filterAndSortUsers, isPendingApproval, RoleFilter, SortDirection, SortKey, StatusFilter } from './user-table';

@Component({
  selector: 'app-rbac',
  imports: [CommonModule, HlmButtonImports, HlmDialogImports, BrnDialogImports, HlmInput, HlmSelectImports, UserEditorDialogComponent],
  template: `
    <div class="flex flex-col h-full p-4 gap-4">
      <div class="flex items-center gap-4 border-b pb-4">
        <h1 class="text-2xl font-bold mr-auto">User Management (RBAC)</h1>
        
        <button hlmBtn variant="outline" (click)="refresh()" [disabled]="isLoading()">
          @if (isLoading()) { Refreshing... } @else { Refresh }
        </button>

        <button hlmBtn variant="default" (click)="openAddUser()">
          Add User
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3" role="search">
        <input hlmInput type="search" class="w-64" placeholder="Search name, department, e-mail…" aria-label="Search users"
          [value]="search()" (input)="search.set($any($event.target).value)" />

        <hlm-select [value]="roleFilter()" (valueChange)="roleFilter.set($event ?? 'all')" [itemToString]="roleFilterLabel">
          <hlm-select-trigger class="w-40" aria-label="Filter by role">
            <hlm-select-value />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-item value="all">All roles</hlm-select-item>
            @for (role of roleNameOptions(); track role) {
              <hlm-select-item [value]="role">{{ role }}</hlm-select-item>
            }
            <hlm-select-item value="none">No role</hlm-select-item>
          </hlm-select-content>
        </hlm-select>

        <hlm-select [value]="statusFilter()" (valueChange)="statusFilter.set($event ?? 'all')" [itemToString]="statusFilterLabel">
          <hlm-select-trigger class="w-36" aria-label="Filter by status">
            <hlm-select-value />
          </hlm-select-trigger>
          <hlm-select-content *hlmSelectPortal>
            <hlm-select-item value="all">All users</hlm-select-item>
            <hlm-select-item value="active">Active</hlm-select-item>
            <hlm-select-item value="inactive">Inactive</hlm-select-item>
            <hlm-select-item value="pending">Pending approval</hlm-select-item>
          </hlm-select-content>
        </hlm-select>

        @if (isFiltered()) {
          <button hlmBtn variant="ghost" size="sm" (click)="resetFilters()">Reset filters</button>
        }
        @if (pendingCount() > 0 && statusFilter() !== 'pending') {
          <button hlmBtn variant="outline" size="sm" class="border-amber-500/60 text-amber-600 dark:text-amber-400"
            (click)="statusFilter.set('pending')">
            {{ pendingCount() }} pending approval
          </button>
        }
        <span class="ml-auto text-sm text-muted-foreground" aria-live="polite">
          {{ visibleUsers().length }} of {{ users().length }} users
        </span>
      </div>

      <div class="flex-1 overflow-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b">
              @for (col of columns; track col.key) {
                <th class="p-2" [attr.aria-sort]="ariaSort(col.key)">
                  <button type="button" class="inline-flex items-center gap-1 font-semibold hover:text-primary"
                    (click)="sortBy(col.key)">
                    {{ col.label }}
                    <span aria-hidden="true" class="text-xs w-3">{{ sortIndicator(col.key) }}</span>
                  </button>
                </th>
              }
              <th class="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (user of visibleUsers(); track user.id) {
              <tr class="border-b hover:bg-muted/50">
                <td class="p-2">{{ user.id }}</td>
                <td class="p-2">{{ user.username }}</td>
                <td class="p-2">{{ user.first_name }}</td>
                <td class="p-2">{{ user.last_name }}</td>
                <td class="p-2">{{ user.department || '-' }}</td>
                <td class="p-2">{{ user.email || '-' }}</td>
                <td class="p-2 font-tron">{{ roleNames(user.id) }}</td>
                <td class="p-2">
                  @if (isPending(user)) {
                    <span class="px-2 py-1 rounded text-xs font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">Pending</span>
                  } @else {
                    <span class="px-2 py-1 rounded text-xs font-bold"
                          [class]="user.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'">
                      {{ user.is_active ? 'Yes' : 'No' }}
                    </span>
                  }
                </td>
                <td class="p-2 flex gap-2">
                  @if (isPending(user)) {
                    <button hlmBtn size="sm" (click)="openApproveUser(user)">Approve</button>
                  }
                  <button hlmBtn variant="outline" size="sm" (click)="openEditUser(user)">Edit</button>
                  <button hlmBtn variant="destructive" size="sm" (click)="terminateSession(user.id)">Terminate Session</button>
                  <button hlmBtn variant="destructive" size="sm" (click)="deleteUser(user)">Delete</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td class="p-4 text-center text-muted-foreground" [attr.colspan]="columns.length + 1">
                  @if (users().length) { No users match the filters. } @else { No users. }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      
      <hlm-dialog [state]="showDialog() ? 'open' : 'closed'" (closed)="closeDialog()">
        <hlm-dialog-content class="sm:max-w-lg max-h-[90vh] overflow-y-auto" *brnDialogContent="let ctx">
          <hlm-dialog-header>
            <h3 hlmDialogTitle>{{ approveMode() ? 'Approve User' : selectedUser() ? 'Edit User' : 'Add User' }}</h3>
          </hlm-dialog-header>
          <app-user-editor-dialog
            [user]="selectedUser()"
            [approve]="approveMode()"
            [roles]="roles()"
            (close)="closeDialog()"
            (saved)="closeDialog(); refresh()">
          </app-user-editor-dialog>
        </hlm-dialog-content>
      </hlm-dialog>
    </div>
  `
})
export class RbacComponent implements OnInit {
  private rbacService = inject(RbacService);
  private authService = inject(AuthService);
  private confirmService = inject(ConfirmService);

  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  /** Role ids per user id; missing while loading, `null` when they could not be read. */
  userRoleIds = signal<Map<number, number[] | null>>(new Map());
  isLoading = signal(false);
  
  readonly columns: { key: SortKey; label: string }[] = [
    { key: 'id', label: 'ID' },
    { key: 'username', label: 'Username' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'department', label: 'Department' },
    { key: 'email', label: 'eMail' },
    { key: 'roles', label: 'Roles' },
    { key: 'is_active', label: 'Active' },
  ];

  search = signal('');
  roleFilter = signal<RoleFilter>('all');
  statusFilter = signal<StatusFilter>('all');
  sortKey = signal<SortKey>('id');
  sortDirection = signal<SortDirection>('asc');

  roleNameOptions = computed(() => this.roles().map(r => r.name.toUpperCase()));
  isFiltered = computed(() => !!this.search().trim() || this.roleFilter() !== 'all' || this.statusFilter() !== 'all');
  visibleUsers = computed(() => filterAndSortUsers(this.users(), id => this.roleNameList(id), {
    search: this.search(),
    role: this.roleFilter(),
    status: this.statusFilter(),
    sortKey: this.sortKey(),
    sortDirection: this.sortDirection(),
  }));

  readonly roleFilterLabel = (value: RoleFilter) => value === 'all' ? 'All roles' : value === 'none' ? 'No role' : value;
  readonly statusFilterLabel = (value: StatusFilter) =>
    ({ all: 'All users', active: 'Active', inactive: 'Inactive', pending: 'Pending approval' })[value];

  pendingCount = computed(() => this.users().filter(u => this.isPending(u)).length);
  approveMode = signal(false);

  showDialog = signal(false);
  selectedUser = signal<User | null>(null);

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    
    forkJoin([this.rbacService.getUsers(), this.rbacService.getRoles()]).subscribe({
      next: ([users, roles]) => {
        this.users.set(users);
        this.roles.set(roles);
        this.userRoleIds.set(new Map());
        this.isLoading.set(false);
        this.loadUserRoles(users);
      },
      error: (err) => {
        console.error('Failed to fetch users:', err);
        toast.error('Failed to load users.', { description: errorDetail(err) });
        this.isLoading.set(false);
      }
    });
  }

  /** Role assignments are stored encrypted per user, so they are read one user at a time. */
  private loadUserRoles(users: User[]) {
    for (const user of users) {
      this.rbacService.getUser(user.id).pipe(
        map(detail => detail.role_ids),
        catchError(() => of(null))
      ).subscribe(roleIds => {
        this.userRoleIds.update(m => new Map(m).set(user.id, roleIds));
      });
    }
  }

  /** Upper-case role names of the user, or `null` while loading or when they could not be read. */
  private roleNameList(userId: number): string[] | null {
    const roleIds = this.userRoleIds().get(userId);
    if (roleIds === undefined || roleIds === null) return null;
    return this.roles().filter(r => roleIds.includes(r.id)).map(r => r.name.toUpperCase());
  }

  sortBy(key: SortKey) {
    if (this.sortKey() === key) {
      this.sortDirection.update(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDirection.set('asc');
    }
  }

  ariaSort(key: SortKey): 'ascending' | 'descending' | null {
    if (this.sortKey() !== key) return null;
    return this.sortDirection() === 'asc' ? 'ascending' : 'descending';
  }

  sortIndicator(key: SortKey): string {
    if (this.sortKey() !== key) return '';
    return this.sortDirection() === 'asc' ? '▲' : '▼';
  }

  resetFilters() {
    this.search.set('');
    this.roleFilter.set('all');
    this.statusFilter.set('all');
  }

  roleNames(userId: number): string {
    const roleIds = this.userRoleIds().get(userId);
    if (roleIds === undefined) return '…';
    if (roleIds === null) return 'n/a';
    const names = this.roles().filter(r => roleIds.includes(r.id)).map(r => r.name.toUpperCase());
    return names.length ? names.join(', ') : '-';
  }

  openAddUser() {
    this.selectedUser.set(null);
    this.approveMode.set(false);
    this.showDialog.set(true);
  }

  openEditUser(user: User) {
    this.selectedUser.set(user);
    this.approveMode.set(false);
    this.showDialog.set(true);
  }

  /** Opens the user dialog with "Is Active" preset; saving activates the user and assigns the selected roles. */
  openApproveUser(user: User) {
    this.selectedUser.set(user);
    this.approveMode.set(true);
    this.showDialog.set(true);
  }

  isPending(user: User): boolean {
    return isPendingApproval(user, this.roleNameList(user.id));
  }

  closeDialog() {
    this.showDialog.set(false);
    this.selectedUser.set(null);
    this.approveMode.set(false);
  }

  async terminateSession(id: number) {
    const confirmed = await this.confirmService.confirm({
      title: 'Terminate session?',
      message: 'The user will be signed out and has to sign in again.',
      confirmLabel: 'Terminate Session',
      destructive: true,
    });
    if (confirmed) {
      this.rbacService.terminateSession(id).subscribe({
        next: () => {
          toast.success('Session terminated.');
          this.refresh();
        },
        error: (err) => toast.error('Failed to terminate the session.', { description: errorDetail(err) })
      });
    }
  }

  async deleteUser(user: User) {
    const isSelf = user.username.toUpperCase() === (this.authService.osUser() ?? '').toUpperCase();
    const confirmed = await this.confirmService.confirm(isSelf
      ? {
          title: 'Delete your own account?',
          message: 'You are about to delete your own account. You will be signed out and cannot sign in again.',
          confirmLabel: 'Delete my account',
          destructive: true,
        }
      : {
          title: 'Delete user?',
          message: `Are you sure you want to delete the user ${user.username}?`,
          confirmLabel: 'Delete',
          destructive: true,
        });
    if (confirmed) {
      this.rbacService.deleteUser(user.id).subscribe({
        next: () => {
          toast.success('User deleted.');
          if (isSelf) {
            this.authService.logout();
            return;
          }
          this.refresh();
        },
        error: (err) => toast.error('Failed to delete the user.', { description: errorDetail(err) })
      });
    }
  }
}

/** The JSON:API error detail of a failed request, or its HTTP status text. */
function errorDetail(err: unknown): string | undefined {
  const e = err as { error?: { errors?: { detail?: string; title?: string }[] }; statusText?: string };
  const first = e?.error?.errors?.[0];
  return first?.detail ?? first?.title ?? e?.statusText ?? undefined;
}
