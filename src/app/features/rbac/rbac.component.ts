import { Component, inject, signal, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-rbac',
  imports: [CommonModule, HlmButtonImports, HlmDialogImports, BrnDialogImports, UserEditorDialogComponent],
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

      <div class="flex-1 overflow-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b">
              <th class="p-2">ID</th>
              <th class="p-2">Username</th>
              <th class="p-2">First Name</th>
              <th class="p-2">Last Name</th>
              <th class="p-2">Department</th>
              <th class="p-2">eMail</th>
              <th class="p-2">Roles</th>
              <th class="p-2">Active</th>
              <th class="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr class="border-b hover:bg-muted/50">
                <td class="p-2">{{ user.id }}</td>
                <td class="p-2">{{ user.username }}</td>
                <td class="p-2">{{ user.first_name }}</td>
                <td class="p-2">{{ user.last_name }}</td>
                <td class="p-2">{{ user.department || '-' }}</td>
                <td class="p-2">{{ user.email || '-' }}</td>
                <td class="p-2 font-tron">{{ roleNames(user.id) }}</td>
                <td class="p-2">
                  <span class="px-2 py-1 rounded text-xs font-bold"
                        [class]="user.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'">
                    {{ user.is_active ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td class="p-2 flex gap-2">
                  <button hlmBtn variant="outline" size="sm" (click)="openEditUser(user)">Edit</button>
                  <button hlmBtn variant="destructive" size="sm" (click)="terminateSession(user.id)">Terminate Session</button>
                  <button hlmBtn variant="destructive" size="sm" (click)="deleteUser(user)">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      
      <hlm-dialog [state]="showDialog() ? 'open' : 'closed'" (closed)="closeDialog()">
        <hlm-dialog-content class="sm:max-w-lg max-h-[90vh] overflow-y-auto" *brnDialogContent="let ctx">
          <hlm-dialog-header>
            <h3 hlmDialogTitle>{{ selectedUser() ? 'Edit User' : 'Add User' }}</h3>
          </hlm-dialog-header>
          <app-user-editor-dialog
            [user]="selectedUser()"
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

  roleNames(userId: number): string {
    const roleIds = this.userRoleIds().get(userId);
    if (roleIds === undefined) return '…';
    if (roleIds === null) return 'n/a';
    const names = this.roles().filter(r => roleIds.includes(r.id)).map(r => r.name.toUpperCase());
    return names.length ? names.join(', ') : '-';
  }

  openAddUser() {
    this.selectedUser.set(null);
    this.showDialog.set(true);
  }

  openEditUser(user: User) {
    this.selectedUser.set(user);
    this.showDialog.set(true);
  }

  closeDialog() {
    this.showDialog.set(false);
    this.selectedUser.set(null);
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
