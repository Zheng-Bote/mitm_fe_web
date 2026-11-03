import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UserEditorDialogComponent } from './user-editor-dialog.component';
import { User } from '../../../../core/models/user.model';

describe('UserEditorDialogComponent', () => {
  let fixture: ComponentFixture<UserEditorDialogComponent>;
  let component: UserEditorDialogComponent;
  let http: HttpTestingController;

  const user: User = {
    id: 7,
    username: 'Q225265',
    first_name: 'Max',
    last_name: 'Mustermann',
    department: 'IT Security',
    email: 'max.mustermann@example.com',
    is_active: true,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserEditorDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(UserEditorDialogComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads department and e-mail when editing and sends them on save', () => {
    fixture.componentRef.setInput('user', user);
    fixture.detectChanges();
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
    fixture.componentRef.setInput('user', { ...user, email: null });
    fixture.detectChanges();
    expect(component.form.value.email).toBe('');

    component.form.patchValue({ email: 'not-an-email' });
    fixture.detectChanges();
    expect(component.form.invalid).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Enter a valid e-mail address.');
  });
});
