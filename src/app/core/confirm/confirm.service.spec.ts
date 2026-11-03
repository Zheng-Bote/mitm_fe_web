import { TestBed } from '@angular/core/testing';
import { ConfirmService } from './confirm.service';

describe('ConfirmService', () => {
  let service: ConfirmService;

  beforeEach(() => {
    // jsdom has no matchMedia; the dialog overlay queries it.
    window.matchMedia ??= ((query: string) => ({
      matches: false, media: query, onchange: null,
      addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    service = TestBed.inject(ConfirmService);
  });

  const dialog = () => document.querySelector('[role="alertdialog"]')!;
  const button = (label: string) =>
    Array.from(dialog().querySelectorAll('button')).find(b => b.textContent?.trim() === label)!;
  const rendered = async () => {
    TestBed.tick();
    await new Promise(r => setTimeout(r));
  };

  it('shows title and message and resolves true on confirm', async () => {
    const result = service.confirm({ title: 'Delete user?', message: 'Really delete Q225265?', confirmLabel: 'Delete', destructive: true });
    await rendered();

    expect(dialog().textContent).toContain('Delete user?');
    const messageId = dialog().getAttribute('aria-describedby')!;
    expect(document.getElementById(messageId)!.textContent).toContain('Really delete Q225265?');

    button('Delete').click();
    expect(await result).toBe(true);
  });

  it('resolves false on cancel', async () => {
    const result = service.confirm({ title: 'Stop job?', message: 'Stop backup?' });
    await rendered();

    button('Cancel').click();
    expect(await result).toBe(false);
  });
});
