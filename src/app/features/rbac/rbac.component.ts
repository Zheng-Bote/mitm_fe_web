import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RbacService } from '../../core/services/rbac.service';
import { User } from '../../core/models/user.model';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { UserEditorDialogComponent } from './components/user-editor-dialog/user-editor-dialog.component';

@Component({
  selector: 'app-rbac',
  imports: [CommonModule, HlmButtonImports, UserEditorDialogComponent],
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
                <td class="p-2">
                  <span class="px-2 py-1 rounded text-xs font-bold"
                        [class]="user.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'">
                    {{ user.is_active ? 'Yes' : 'No' }}
                  </span>
                </td>
                <td class="p-2 flex gap-2">
                  <button hlmBtn variant="outline" size="sm" (click)="openEditUser(user)">Edit</button>
                  <button hlmBtn variant="destructive" size="sm" (click)="terminateSession(user.id)">Terminate Session</button>
                  <button hlmBtn variant="destructive" size="sm" (click)="deleteUser(user.id)">Delete</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      
      @if (showDialog()) {
        <app-user-editor-dialog 
          [user]="selectedUser()" 
          (close)="closeDialog()" 
          (saved)="refresh()">
        </app-user-editor-dialog>
      }
    </div>
  `
})
export class RbacComponent implements OnInit {
  private rbacService = inject(RbacService);

  users = signal<User[]>([]);
  isLoading = signal(false);
  
  showDialog = signal(false);
  selectedUser = signal<User | null>(null);

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    if (this.isLoading()) return;
    this.isLoading.set(true);
    
    this.rbacService.getUsers().subscribe({
      next: (data) => {
        this.users.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to fetch users:', err);
        this.isLoading.set(false);
      }
    });
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

  terminateSession(id: number) {
    if (confirm('Are you sure you want to terminate the session for this user?')) {
      this.rbacService.terminateSession(id).subscribe(() => this.refresh());
    }
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.rbacService.deleteUser(id).subscribe(() => this.refresh());
    }
  }
}
