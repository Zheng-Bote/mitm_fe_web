import { Component, computed, input, output, inject, OnInit, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RbacService } from '../../../../core/services/rbac.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Role, User } from '../../../../core/models/user.model';
import { HlmButtonImports } from '@spartan-ng/helm/button';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmFieldImports } from '@spartan-ng/helm/field';
import { HlmInput } from '@spartan-ng/helm/input';
import { ConfirmService } from '../../../../core/confirm/confirm.service';

@Component({
  selector: 'app-user-editor-dialog',
  imports: [ReactiveFormsModule, HlmButtonImports, HlmCheckbox, HlmDialogImports, HlmFieldImports, HlmInput],
  template: `
    <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col gap-4">
      <hlm-field>
        <label hlmFieldLabel for="user-username">Username</label>
        <input hlmInput id="user-username" formControlName="username" type="text" autocomplete="off" [readonly]="!!user()" />
      </hlm-field>

      @if (!user()) {
        <hlm-field>
          <label hlmFieldLabel for="user-password">Password</label>
          <input hlmInput id="user-password" formControlName="password" type="password" autocomplete="new-password" />
        </hlm-field>
      }

      <div class="grid grid-cols-2 gap-4">
        <hlm-field>
          <label hlmFieldLabel for="user-first-name">First Name</label>
          <input hlmInput id="user-first-name" formControlName="first_name" type="text" />
        </hlm-field>
        <hlm-field>
          <label hlmFieldLabel for="user-last-name">Last Name</label>
          <input hlmInput id="user-last-name" formControlName="last_name" type="text" />
        </hlm-field>
      </div>

      <hlm-field>
        <label hlmFieldLabel for="user-department">Department</label>
        <input hlmInput id="user-department" formControlName="department" type="text" />
      </hlm-field>

      <hlm-field>
        <label hlmFieldLabel for="user-email">eMail</label>
        <input hlmInput id="user-email" formControlName="email" type="email" />
        @if (form.controls.email.invalid) {
          <p class="text-xs text-destructive">Enter a valid e-mail address.</p>
        }
      </hlm-field>

      <fieldset hlmFieldSet>
        <legend hlmFieldLegend variant="label">Roles</legend>
        @if (rolesLoaded()) {
          @for (role of roles(); track role.id) {
            <hlm-field orientation="horizontal">
              <hlm-checkbox [inputId]="'user-role-' + role.id" [checked]="selectedRoleIds().has(role.id)"
                (checkedChange)="toggleRole(role.id)" />
              <label hlmFieldLabel class="font-tron" [for]="'user-role-' + role.id">{{ role.name.toUpperCase() }}</label>
            </hlm-field>
          } @empty {
            <p class="text-xs text-muted-foreground">No roles available.</p>
          }
        } @else {
          <p class="text-xs text-muted-foreground">Loading roles…</p>
        }
      </fieldset>

      @if (removesOwnAdmin()) {
        <p class="text-sm text-destructive border border-destructive/50 rounded p-2" role="alert">
          You are removing the ADMIN role from your own account. You will lose access to User Management
          and cannot undo this yourself.
        </p>
      }

      <hlm-field orientation="horizontal">
        <hlm-checkbox inputId="user-is-active" formControlName="is_active" />
        <label hlmFieldLabel for="user-is-active">Is Active</label>
      </hlm-field>

      @if (deactivatesSelf()) {
        <p class="text-sm text-destructive border border-destructive/50 rounded p-2" role="alert">
          You are deactivating your own account. You will not be able to sign in again
          until another administrator activates it.
        </p>
      }

      @if (errorMessage(); as err) {
        <p class="text-sm text-destructive">{{ err }}</p>
      }

      <hlm-dialog-footer>
        <button type="button" hlmBtn variant="outline" (click)="close.emit()">Cancel</button>
        <button type="submit" hlmBtn [disabled]="form.invalid || !rolesLoaded() || isSaving()">Save</button>
      </hlm-dialog-footer>
    </form>
  `
})
export class UserEditorDialogComponent implements OnInit {
  user = input<User | null>(null);
  roles = input<Role[]>([]);
  close = output<void>();
  saved = output<void>();

  private rbacService = inject(RbacService);
  private authService = inject(AuthService);
  private confirmService = inject(ConfirmService);
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

  async save() {
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
    if (lockouts.length) {
      const confirmed = await this.confirmService.confirm({
        title: 'Lock yourself out?',
        message: `You are about to ${lockouts.join(' and ')}. Continue?`,
        confirmLabel: 'Save anyway',
        destructive: true,
      });
      if (!confirmed) return;
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
