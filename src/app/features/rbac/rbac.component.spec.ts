import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RbacComponent } from './rbac.component';
import { User } from '../../core/models/user.model';

describe('RbacComponent', () => {
  let fixture: ComponentFixture<RbacComponent>;
  let http: HttpTestingController;

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
      providers: [provideHttpClient(), provideHttpClientTesting()],
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

  afterEach(() => http.verify());

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
