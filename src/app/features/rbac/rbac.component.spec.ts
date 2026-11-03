import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { toast } from '@spartan-ng/brain/sonner';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RbacComponent } from './rbac.component';
import { User } from '../../core/models/user.model';
import { AuthService } from '../../core/auth/auth.service';

describe('RbacComponent', () => {
  let fixture: ComponentFixture<RbacComponent>;
  let http: HttpTestingController;
  const logout = vi.fn();

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
  });

  function flushUserRoles() {
    http.expectOne('/api/v1/iam/users/1').flush({ ...users[0], role_ids: [1] });
    http.expectOne('/api/v1/iam/users/2').flush({ ...users[1], role_ids: [3] });
    http.expectOne('/api/v1/iam/users/3').flush({ ...users[2], role_ids: [] });
  }

  it('shows an error toast with the backend detail when deleting fails', () => {
    flushUserRoles();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const error = vi.spyOn(toast, 'error');

    fixture.componentInstance.deleteUser(users[1]);
    http.expectOne({ method: 'DELETE', url: '/api/v1/iam/users/2' }).flush(
      { errors: [{ status: '500', title: 'Database error', detail: 'connection refused' }] },
      { status: 500, statusText: 'Internal Server Error' },
    );

    expect(error).toHaveBeenCalledWith('Failed to delete the user.', { description: 'connection refused' });
  });

  it('shows an error toast when terminating a session fails', () => {
    flushUserRoles();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const error = vi.spyOn(toast, 'error');

    fixture.componentInstance.terminateSession(2);
    http.expectOne({ method: 'DELETE', url: '/api/v1/iam/users/2/session' }).flush(null, { status: 503, statusText: 'Service Unavailable' });

    expect(error).toHaveBeenCalledWith('Failed to terminate the session.', { description: 'Service Unavailable' });
  });

  it('warns before deleting the own account and signs out afterwards', () => {
    flushUserRoles();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    fixture.componentInstance.deleteUser(users[0]);
    expect(confirmSpy.mock.calls[0][0]).toContain('your own account');
    http.expectOne({ method: 'DELETE', url: '/api/v1/iam/users/1' }).flush(null);

    expect(logout).toHaveBeenCalled();
    http.expectNone('/api/v1/iam/users');
  });

  it('uses the normal question when deleting another user', () => {
    flushUserRoles();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    fixture.componentInstance.deleteUser(users[1]);
    expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this user?');
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
