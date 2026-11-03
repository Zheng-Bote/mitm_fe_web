import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Layout } from './layout';
import packageJson from '../../../package.json';

describe('Layout', () => {
  let component: Layout;
  let fixture: ComponentFixture<Layout>;

  beforeEach(async () => {
    // jsdom has no matchMedia; the dialog overlay queries it.
    window.matchMedia ??= ((query: string) => ({
      matches: false, media: query, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
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

  it('should open and close user settings modal', async () => {
    expect(component.showUserSettings()).toBe(false);
    component.openUserSettings();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.showUserSettings()).toBe(true);
    // The dialog renders into the CDK overlay container, outside the component.
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('User Settings');
    expect(dialog.textContent).toContain('eMail');

    component.closeUserSettings();
    fixture.detectChanges();
    expect(component.showUserSettings()).toBe(false);
  });
});
