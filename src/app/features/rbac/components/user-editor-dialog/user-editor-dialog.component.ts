import { Component, computed, input, output, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RbacService } from '../../../../core/services/rbac.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Role, User } from '../../../../core/models/user.model';
import { HlmButtonImports } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-user-editor-dialog',
  imports: [CommonModule, ReactiveFormsModule, HlmButtonImports],
  template: `
    <div class="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-card text-card-foreground border border-border rounded-xl p-6 w-full max-w-md shadow-lg">
        <h2 class="text-xl font-bold mb-4">
          @if (user()) { Edit User } @else { Add User }
        </h2>

        <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4">
          
          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Username</label>
            <input formControlName="username" type="text" class="border border-border rounded p-2 bg-background text-foreground" [readonly]="!!user()">
          </div>

          @if (!user()) {
            <div class="flex flex-col gap-2">
              <label class="text-sm font-medium">Password</label>
              <input formControlName="password" type="password" class="border border-border rounded p-2 bg-background text-foreground">
            </div>
          }

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">First Name</label>
            <input formControlName="first_name" type="text" class="border border-border rounded p-2 bg-background text-foreground">
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Last Name</label>
            <input formControlName="last_name" type="text" class="border border-border rounded p-2 bg-background text-foreground">
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">Department</label>
            <input formControlName="department" type="text" class="border border-border rounded p-2 bg-background text-foreground">
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-sm font-medium">eMail</label>
            <input formControlName="email" type="email" class="border border-border rounded p-2 bg-background text-foreground">
            @if (form.controls.email.invalid) {
              <p class="text-xs text-destructive">Enter a valid e-mail address.</p>
            }
          </div>

          <fieldset class="flex flex-col gap-2">
            <legend class="text-sm font-medium mb-2">Roles</legend>
            @if (rolesLoaded()) {
              @for (role of roles(); track role.id) {
                <label class="flex items-center gap-2 text-sm font-tron">
                  <input type="checkbox" class="rounded border-border bg-background"
                    [checked]="selectedRoleIds().has(role.id)" (change)="toggleRole(role.id)">
                  {{ role.name.toUpperCase() }}
                </label>
              } @empty {
                <p class="text-xs text-foreground/70">No roles available.</p>
              }
            } @else {
              <p class="text-xs text-foreground/70">Loading roles…</p>
            }
          </fieldset>

          @if (removesOwnAdmin()) {
            <p class="text-sm text-destructive border border-destructive/50 rounded p-2" role="alert">
              You are removing the ADMIN role from your own account. You will lose access to User Management
              and cannot undo this yourself.
            </p>
          }

          <div class="flex items-center gap-2 mt-2">
            <input formControlName="is_active" type="checkbox" id="isActive" class="rounded border-border bg-background">
            <label for="isActive" class="text-sm font-medium">Is Active</label>
          </div>

          @if (deactivatesSelf()) {
            <p class="text-sm text-destructive border border-destructive/50 rounded p-2" role="alert">
              You are deactivating your own account. You will not be able to sign in again
              until another administrator activates it.
            </p>
          }

          @if (errorMessage(); as err) {
            <p class="text-sm text-destructive">{{ err }}</p>
          }

          <div class="flex justify-end gap-2 mt-4">
            <button type="button" hlmBtn variant="outline" (click)="close.emit()">Close</button>
            <button type="submit" hlmBtn variant="default" [disabled]="form.invalid || !rolesLoaded() || isSaving()">Save</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class UserEditorDialogComponent implements OnInit {
  user = input<User | null>(null);
  roles = input<Role[]>([]);
  close = output<void>();
  saved = output<void>();

  private rbacService = inject(RbacService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    username: ['', Validators.required],
    password: [''],
    first_name: [''],
    last_name: [''],
    department: [''],
    email: ['', Validators.email],
    is_active: [true]
  });

  selectedRoleIds = signal<Set<number>>(new Set());
  /** False while the role assignment of the edited user is loading or could not be read. */
  rolesLoaded = signal(true);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  private initialRoleIds = signal<Set<number>>(new Set());

  private isActive = toSignal(this.form.controls.is_active.valueChanges, { initialValue: this.form.controls.is_active.value });

  /** True when the edited user is the signed-in user. */
  private isSelf = computed(() => {
    const u = this.user();
    return !!u && u.username.toUpperCase() === (this.authService.osUser() ?? '').toUpperCase();
  });

  /** True when the signed-in administrator is about to remove the ADMIN role from their own account. */
  removesOwnAdmin = computed(() => {
    const adminRole = this.roles().find(r => r.name.toUpperCase() === 'ADMIN');
    return this.isSelf() && !!adminRole
      && this.initialRoleIds().has(adminRole.id)
      && !this.selectedRoleIds().has(adminRole.id);
  });

  /** True when the signed-in user is about to deactivate their own active account. */
  deactivatesSelf = computed(() => this.isSelf() && !!this.user()?.is_active && this.isActive() === false);

  ngOnInit() {
    const u = this.user();
    if (u) {
      this.rolesLoaded.set(false);
      this.rbacService.getUser(u.id).subscribe({
        next: detail => {
          this.initialRoleIds.set(new Set(detail.role_ids));
          this.selectedRoleIds.set(new Set(detail.role_ids));
          this.rolesLoaded.set(true);
        },
        error: () => this.errorMessage.set('Failed to load the roles of this user.')
      });
      this.form.patchValue({
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name,
        department: u.department ?? '',
        email: u.email ?? '',
        is_active: u.is_active
      });
      // password is not required when editing
    } else {
      this.form.get('password')?.setValidators(Validators.required);
    }
  }

  toggleRole(roleId: number) {
    this.selectedRoleIds.update(ids => {
      const next = new Set(ids);
      if (!next.delete(roleId)) next.add(roleId);
      return next;
    });
  }

  save() {
    if (this.form.invalid || !this.rolesLoaded() || this.isSaving()) return;

    const val = this.form.value as Partial<User>;
    const u = this.user();
    const roleIds = this.roles().map(r => r.id).filter(id => this.selectedRoleIds().has(id));
    const initial = this.initialRoleIds();
    const rolesChanged = roleIds.length !== initial.size || roleIds.some(id => !initial.has(id));
    const lockouts = [
      this.removesOwnAdmin() ? 'remove the ADMIN role from your own account and lose access to User Management' : null,
      this.deactivatesSelf() ? 'deactivate your own account and not be able to sign in again' : null,
    ].filter(Boolean);
    if (lockouts.length && !confirm(`You are about to ${lockouts.join(' and ')}. Continue?`)) {
      return;
    }
    const assign = (userId: number): Observable<void | null> =>
      rolesChanged ? this.rbacService.assignRoles(userId, roleIds) : of(null);

    const reloadOwnRoles = lockouts.length > 0;
    let userSaved = false;
    const request = u
      ? this.rbacService.updateUser(u.id, val).pipe(switchMap(() => { userSaved = true; return assign(u.id); }))
      : this.rbacService.addUser(val).pipe(switchMap(created => { userSaved = true; return assign(created.id); }));

    this.isSaving.set(true);
    this.errorMessage.set(null);
    request.subscribe({
      next: () => {
        if (reloadOwnRoles) {
          // Update the own session roles right away so navigation and guards reflect the lost access.
          this.authService.fetchRoles().subscribe();
        }
        this.saved.emit();
      },
      error: () => {
        if (userSaved) {
          // The user exists now; saving again would try to create it twice.
          this.errorMessage.set('The user was saved, but assigning the roles failed. Edit the user to assign the roles again.');
          return;
        }
        this.isSaving.set(false);
        this.errorMessage.set('Saving failed. Please check the input and try again.');
      }
    });
  }
}
