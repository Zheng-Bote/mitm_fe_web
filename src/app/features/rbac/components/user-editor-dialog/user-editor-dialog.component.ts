import { Component, input, output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RbacService } from '../../../../core/services/rbac.service';
import { User } from '../../../../core/models/user.model';
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

          <div class="flex items-center gap-2 mt-2">
            <input formControlName="is_active" type="checkbox" id="isActive" class="rounded border-border bg-background">
            <label for="isActive" class="text-sm font-medium">Is Active</label>
          </div>

          <div class="flex justify-end gap-2 mt-4">
            <button type="button" hlmBtn variant="outline" (click)="close.emit()">Cancel</button>
            <button type="submit" hlmBtn variant="default" [disabled]="form.invalid">Save</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class UserEditorDialogComponent implements OnInit {
  user = input<User | null>(null);
  close = output<void>();
  saved = output<void>();

  private rbacService = inject(RbacService);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    username: ['', Validators.required],
    password: [''],
    first_name: [''],
    last_name: [''],
    is_active: [true]
  });

  ngOnInit() {
    const u = this.user();
    if (u) {
      this.form.patchValue({
        username: u.username,
        first_name: u.first_name,
        last_name: u.last_name,
        is_active: u.is_active
      });
      // password is not required when editing
    } else {
      this.form.get('password')?.setValidators(Validators.required);
    }
  }

  save() {
    if (this.form.invalid) return;

    const val = this.form.value as Partial<User>;
    const u = this.user();

    if (u) {
      this.rbacService.updateUser(u.id, val).subscribe(() => this.saved.emit());
    } else {
      this.rbacService.addUser(val).subscribe(() => this.saved.emit());
    }
  }
}
