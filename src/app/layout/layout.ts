import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

@Component({
  imports: [RouterModule],
  selector: 'app-layout',
  styleUrl: './layout.css',
  templateUrl: './layout.html',
})
export class Layout {
  public authService = inject(AuthService);

  logout() {
    this.authService.logout();
  }
}
