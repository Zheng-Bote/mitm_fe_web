import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';

@Component({
  imports: [RouterModule],
  selector: 'app-layout',
  styleUrl: './layout.css',
  templateUrl: './layout.html',
})
export class Layout implements OnInit {
  public authService = inject(AuthService);
  public currentTheme = signal<string>('light');

  ngOnInit() {
    const savedTheme = localStorage.getItem('mitm_theme') || 'light';
    this.setTheme(savedTheme);
  }

  switchTheme(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.setTheme(select.value);
  }

  private setTheme(theme: string) {
    this.currentTheme.set(theme);
    localStorage.setItem('mitm_theme', theme);
    
    // Manage class on html element
    const html = document.documentElement;
    html.classList.remove('light', 'dark', 'tron');
    if (theme !== 'light') {
      html.classList.add(theme);
    }
  }

  logout() {
    this.authService.logout();
  }
}
