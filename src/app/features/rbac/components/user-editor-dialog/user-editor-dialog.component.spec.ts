import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserEditorDialogComponent } from './user-editor-dialog.component';
import { Role, User } from '../../../../core/models/user.model';
import { AuthService } from '../../../../core/auth/auth.service';
import { ConfirmService } from '../../../../core/confirm/confirm.service';

describe('UserEditorDialogComponent', () => {
  let fixture: ComponentFixture<UserEditorDialogComponent>;
  let component: UserEditorDialogComponent;
  let http: HttpTestingController;
  const fetchRoles = vi.fn(() => of([]));
  const confirm = vi.fn<(o: { message: string }) => Promise<boolean>>();

  const roles: Role[] = [
    { id: 1, name: 'ADMIN' },
    { id: 2, name: 'USER' },
    { id: 3, name: 'VIEWER' },
  ];

  const user: User = {
    id: 7,
    username: 'Q225265',
    first_name: 'Max',
    last_name: 'Mustermann',
    department: 'IT Security',
    email: 'max.mustermann@example.com',
    is_active: true,
  };

  /** The Spartan checkbox (a `button[role=checkbox]`) linked to the role label. */
  function roleCheckbox(name: string): HTMLElement {
    const label = Array.from<HTMLLabelElement>(fixture.nativeElement.querySelectorAll('fieldset label'))
      .find(l => l.textContent?.trim() === name)!;
    return fixture.nativeElement.querySelector(`#${label.htmlFor}`)!;
  }

  const isChecked = (name: string) => roleCheckbox(name).getAttribute('aria-checked') === 'true';

  function openEdit(u: User = user, roleIds: number[] = [3]) {
    fixture.componentRef.setInput('user', u);
    fixture.detectChanges();
    http.expectOne({ method: 'GET', url: `/api/v1/iam/users/${u.id}` }).flush({ ...u, role_ids: roleIds });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserEditorDialogComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { osUser: signal('ADMIN1'), fetchRoles } },
        { provide: ConfirmService, useValue: { confirm } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(UserEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('roles', roles);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
    fetchRoles.mockClear();
    confirm.mockReset();
  });

  describe('removing the own ADMIN role', () => {
    const self: User = { ...user, id: 1, username: 'admin1' };

    it('warns and asks for confirmation before saving', async () => {
      openEdit(self, [1]);
      expect(component.removesOwnAdmin()).toBe(false);

      roleCheckbox('ADMIN').click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('your own account');

      confirm.mockResolvedValue(false);
      await component.save();
      expect(confirm).toHaveBeenCalled();
      http.expectNone('/api/v1/iam/users/1');
    });

    it('saves after confirmation and reloads the own roles', async () => {
      openEdit(self, [1]);
      roleCheckbox('ADMIN').click();
      confirm.mockResolvedValue(true);
      await component.save();

      http.expectOne({ method: 'PUT', url: '/api/v1/iam/users/1' }).flush(null);
      const assign = http.expectOne('/api/v1/iam/assign-role');
      expect(assign.request.body).toEqual({ user_id: 1, role_ids: [] });
      expect(fetchRoles).not.toHaveBeenCalled();
      assign.flush(null);
      expect(fetchRoles).toHaveBeenCalledTimes(1);
    });

    it('warns before deactivating the own account', async () => {
      openEdit(self, [1]);
      component.form.controls.is_active.setValue(false);
      fixture.detectChanges();
      expect(component.deactivatesSelf()).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('You are deactivating your own account.');

      confirm.mockResolvedValue(false);
      await component.save();
      expect(confirm.mock.calls[0][0].message).toContain('deactivate your own account');
      http.expectNone('/api/v1/iam/users/1');
    });

    it('does not warn when editing another administrator', () => {
      openEdit({ ...user, id: 2, username: 'ADMIN2' }, [1]);
      roleCheckbox('ADMIN').click();
      component.form.controls.is_active.setValue(false);
      fixture.detectChanges();
      expect(component.removesOwnAdmin()).toBe(false);
      expect(component.deactivatesSelf()).toBe(false);
      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    });
  });

  it('loads department and e-mail when editing and sends them on save', () => {
    openEdit();
    expect(component.form.value.department).toBe('IT Security');
    expect(component.form.value.email).toBe('max.mustermann@example.com');

    component.form.patchValue({ department: 'Finance', email: 'max@example.com' });
    component.save();

    const req = http.expectOne('/api/v1/iam/users/7');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(expect.objectContaining({ department: 'Finance', email: 'max@example.com' }));
    req.flush(null);
  });

  it('rejects an invalid e-mail address', () => {
    openEdit({ ...user, email: null });
    expect(component.form.value.email).toBe('');

    component.form.patchValue({ email: 'not-an-email' });
    fixture.detectChanges();
    expect(component.form.invalid).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Enter a valid e-mail address.');
  });

  it('preselects the current roles and replaces them on save', () => {
    openEdit(user, [3]);
    expect(isChecked('VIEWER')).toBe(true);
    expect(isChecked('USER')).toBe(false);

    roleCheckbox('USER').click();
    roleCheckbox('VIEWER').click();
    const saved = vi.fn();
    component.saved.subscribe(saved);
    component.save();

    http.expectOne({ method: 'PUT', url: '/api/v1/iam/users/7' }).flush(null);
    const assign = http.expectOne({ method: 'POST', url: '/api/v1/iam/assign-role' });
    expect(assign.request.body).toEqual({ user_id: 7, role_ids: [2] });
    assign.flush(null);
    expect(saved).toHaveBeenCalled();
  });

  it('does not reassign unchanged roles', () => {
    openEdit(user, [3]);
    component.save();
    http.expectOne({ method: 'PUT', url: '/api/v1/iam/users/7' }).flush(null);
    http.expectNone('/api/v1/iam/assign-role');
  });

  it('assigns the selected roles to a new user using the returned id', () => {
    fixture.detectChanges();
    component.form.patchValue({ username: 'q225265', password: 'secret' });
    roleCheckbox('VIEWER').click();
    component.save();

    http.expectOne({ method: 'POST', url: '/api/v1/iam/users' }).flush({ id: 42 }, { status: 201, statusText: 'Created' });
    const assign = http.expectOne({ method: 'POST', url: '/api/v1/iam/assign-role' });
    expect(assign.request.body).toEqual({ user_id: 42, role_ids: [3] });
    assign.flush(null);
  });

  it('keeps saving disabled when the roles of the user cannot be loaded', () => {
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();
    http.expectOne('/api/v1/iam/users/7').flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.rolesLoaded()).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Failed to load the roles of this user.');
    const saveButton: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(saveButton.disabled).toBe(true);
  });

  it('reports a failed role assignment after the user was created', () => {
    fixture.detectChanges();
    component.form.patchValue({ username: 'Q225265', password: 'secret' });
    roleCheckbox('ADMIN').click();
    component.save();

    http.expectOne({ method: 'POST', url: '/api/v1/iam/users' }).flush({ id: 42 });
    http.expectOne('/api/v1/iam/assign-role').flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('assigning the roles failed');
    expect(component.isSaving()).toBe(true);
  });
});
