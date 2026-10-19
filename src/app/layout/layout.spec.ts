import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Layout } from './layout';
import packageJson from '../../../package.json';

describe('Layout', () => {
  let component: Layout;
  let fixture: ComponentFixture<Layout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Layout],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Layout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create and display version from package.json', () => {
    expect(component).toBeTruthy();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain(`VERSION: ${packageJson.version}`);
    expect(text).toContain('USER_SETTINGS');
  });

  it('should open and close user settings modal', () => {
    expect(component.showUserSettings()).toBe(false);
    component.openUserSettings();
    fixture.detectChanges();
    expect(component.showUserSettings()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('User Settings');

    component.closeUserSettings();
    fixture.detectChanges();
    expect(component.showUserSettings()).toBe(false);
  });
});
