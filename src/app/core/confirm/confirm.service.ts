// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { ConfirmDialogComponent, ConfirmOptions } from './confirm-dialog.component';

/** Spartan-NG replacement for `window.confirm()`. */
let nextId = 0;

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly dialog = inject(HlmDialogService);

  /** Resolves `true` only when the user clicks the confirm button. */
  async confirm(options: ConfirmOptions): Promise<boolean> {
    // The message is linked via ariaDescribedBy: hlmDialogDescription registers itself too late
    // in programmatically opened dialogs and triggers NG0100.
    const messageId = `confirm-dialog-message-${++nextId}`;
    const ref = this.dialog.open<boolean, ConfirmOptions & { messageId: string }>(ConfirmDialogComponent, {
      context: { ...options, messageId },
      ariaDescribedBy: messageId,
      role: 'alertdialog',
      contentClass: 'sm:max-w-[425px]',
    });
    return (await firstValueFrom(ref.closed$)) === true;
  }
}
