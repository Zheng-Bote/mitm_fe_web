// SPDX-FileCopyrightText: 2026 ZHENG Robert
// SPDX-License-Identifier: Apache-2.0

import { Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  /** Styles the confirm button as destructive (delete, lockout, …). */
  destructive?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  imports: [HlmButton, HlmDialogImports],
  template: `
    <hlm-dialog-header>
      <h3 hlmDialogTitle>{{ options.title }}</h3>
      <p class="text-muted-foreground text-sm" [id]="options.messageId">{{ options.message }}</p>
    </hlm-dialog-header>
    <hlm-dialog-footer>
      <button type="button" hlmBtn variant="outline" (click)="close(false)">Cancel</button>
      <button type="button" hlmBtn [variant]="options.destructive ? 'destructive' : 'default'" (click)="close(true)">
        {{ options.confirmLabel ?? 'Confirm' }}
      </button>
    </hlm-dialog-footer>
  `,
})
export class ConfirmDialogComponent {
  protected readonly options = injectBrnDialogContext<ConfirmOptions & { messageId: string }>();
  private readonly dialogRef = inject<BrnDialogRef<boolean>>(BrnDialogRef);

  protected close(result: boolean): void {
    this.dialogRef.close(result);
  }
}
