import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { toast } from '@spartan-ng/brain/sonner';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RbacComponent } from './rbac.component';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../core/confirm/confirm.service';

describe('RbacComponent', () => {
  let fixture: ComponentFixture<RbacComponent>;
  let http: HttpTestingController;
  const logout = vi.fn();
  const confirm = vi.fn<(o: { title: string; message: string }) => Promise<boolean>>();

  const users: User[] = [
    { id: 1, username: 'ADMIN', first_name: 'Ada', last_name: 'Admin', department: null, email: null, is_active: true },
    { id: 2, username: 'Q225265', first_name: 'Max', last_name: 'Mustermann', department: 'IT', email: null, is_active: true },
    { id: 3, username: 'NOROLE', first_name: 'No', last_name: 'Role', department: null, email: null, is_active: false },
  ];

  function rolesCell(row: number): string {
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    return rows[row].querySelectorAll('td')[6].textContent.trim();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RbacComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { osUser: signal('ADMIN'), logout } },
        { provide: ConfirmService, useValue: { confirm } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RbacComponent);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http.expectOne('/api/v1/iam/users').flush(users);
    http.expectOne('/api/v1/iam/roles').flush([
      { id: 1, name: 'ADMIN' },
      { id: 2, name: 'USER' },
      { id: 3, name: 'VIEWER' },
    ]);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
    logout.mockClear();
    confirm.mockReset();
  });

  function flushUserRoles() {
    http.expectOne('/api/v1/iam/users/1').flush({ ...users[0], role_ids: [1] });
    http.expectOne('/api/v1/iam/users/2').flush({ ...users[1], role_ids: [3] });
    http.expectOne('/api/v1/iam/users/3').flush({ ...users[2], role_ids: [] });
  }

  it('shows an error toast with the backend detail when deleting fails', async () => {
    flushUserRoles();
    confirm.mockResolvedValue(true);
    const error = vi.spyOn(toast, 'error');

    await fixture.componentInstance.deleteUser(users[1]);
    http.expectOne({ method: 'DELETE', url: '/api/v1/iam/users/2' }).flush(
      { errors: [{ status: '500', title: 'Database error', detail: 'connection refused' }] },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(error).toHaveBeenCalledWith('Failed to delete the user.', { description: 'connection refused' });
  });

  it('shows an error toast when terminating a session fails', async () => {
    flushUserRoles();
    confirm.mockResolvedValue(true);
    const error = vi.spyOn(toast, 'error');

    await fixture.componentInstance.terminateSession(2);
    http.expectOne({ method: 'DELETE', url: '/api/v1/iam/users/2/session' }).flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(error).toHaveBeenCalledWith('Failed to terminate the session.', { description: 'Service Unavailable' });
  });

  it('warns before deleting the own account and signs out afterwards', async () => {
    flushUserRoles();
    confirm.mockResolvedValue(true);

    await fixture.componentInstance.deleteUser(users[0]);
    expect(confirm.mock.calls[0][0].message).toContain('your own account');
    http.expectOne({ method: 'DELETE', url: '/api/v1/iam/users/1' }).flush(null);

    expect(logout).toHaveBeenCalled();
    http.expectNone('/api/v1/iam/users');
  });

  it('uses the normal question when deleting another user', async () => {
    flushUserRoles();
    confirm.mockResolvedValue(false);
    await fixture.componentInstance.deleteUser(users[1]);
    expect(confirm.mock.calls[0][0]).toEqual(expect.objectContaining({
      title: 'Delete user?',
      message: 'Are you sure you want to delete the user Q225265?',
    }));
    http.expectNone({ method: 'DELETE', url: '/api/v1/iam/users/2' });
  });

  const usernames = (): string[] =>
    Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('tbody tr'))
      .map(r => r.querySelectorAll('td')[1]?.textContent?.trim() ?? '');

  it('filters the table by the search field and shows the count', () => {
    flushUserRoles();
    const search: HTMLInputElement = fixture.nativeElement.querySelector('input[type="search"]');
    search.value = 'muster';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(usernames()).toEqual(['Q225265']);
    expect(fixture.nativeElement.textContent).toContain('1 of 3 users');

    search.value = 'nobody';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No users match the filters.');
  });

  it('sorts by a column header and toggles the direction', () => {
    flushUserRoles();
    const header = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('thead th'))
      .find(th => th.textContent?.includes('Username'))!;

    header.querySelector('button')!.click();
    fixture.detectChanges();
    expect(header.getAttribute('aria-sort')).toBe('ascending');
    expect(usernames()).toEqual(['ADMIN', 'NOROLE', 'Q225265']);

    header.querySelector('button')!.click();
    fixture.detectChanges();
    expect(header.getAttribute('aria-sort')).toBe('descending');
    expect(usernames()).toEqual(['Q225265', 'NOROLE', 'ADMIN']);
  });

  it('marks inactive users without roles as pending and offers Approve', () => {
    flushUserRoles();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows[2].textContent).toContain('Pending');
    expect(Array.from<HTMLButtonElement>(rows[2].querySelectorAll('button')).map(b => b.textContent?.trim())).toContain('Approve');
    expect(rows[1].textContent).not.toContain('Approve');

    const pendingButton = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === '1 pending approval')!;
    pendingButton.click();
    fixture.detectChanges();
    expect(usernames()).toEqual(['NOROLE']);

    fixture.componentInstance.openApproveUser(users[2]);
    expect(fixture.componentInstance.approveMode()).toBe(true);
  });

  it('filters by role and status and resets the filters', () => {
    flushUserRoles();
    const component = fixture.componentInstance;
    component.roleFilter.set('VIEWER');
    fixture.detectChanges();
    expect(usernames()).toEqual(['Q225265']);

    component.roleFilter.set('all');
    component.statusFilter.set('inactive');
    fixture.detectChanges();
    expect(usernames()).toEqual(['NOROLE']);

    const reset = Array.from<HTMLButtonElement>(fixture.nativeElement.querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Reset filters')!;
    reset.click();
    fixture.detectChanges();
    expect(usernames()).toEqual(['ADMIN', 'Q225265', 'NOROLE']);
  });

  it('shows the role names of every user in the Roles column', () => {
    expect(fixture.nativeElement.querySelector('thead').textContent).toContain('Roles');
    expect(rolesCell(0)).toBe('…');

    http.expectOne('/api/v1/iam/users/1').flush({ ...users[0], role_ids: [1, 2] });
    http.expectOne('/api/v1/iam/users/2').flush({ ...users[1], role_ids: [3] });
    http.expectOne('/api/v1/iam/users/3').flush({ ...users[2], role_ids: [] });
    fixture.detectChanges();

    expect(rolesCell(0)).toBe('ADMIN, USER');
    expect(rolesCell(1)).toBe('VIEWER');
    expect(rolesCell(2)).toBe('-');
  });

  it('marks users whose roles could not be read', () => {
    http.expectOne('/api/v1/iam/users/1').flush(null, { status: 500, statusText: 'Server Error' });
    http.expectOne('/api/v1/iam/users/2').flush({ ...users[1], role_ids: [3] });
    http.expectOne('/api/v1/iam/users/3').flush({ ...users[2], role_ids: [] });
    fixture.detectChanges();

    expect(rolesCell(0)).toBe('n/a');
    expect(rolesCell(1)).toBe('VIEWER');
  });
});
