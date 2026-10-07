import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto p-6 bg-card text-card-foreground shadow-lg rounded-xl border border-border mt-8">
      <h2 class="text-2xl font-bold font-tron text-primary mb-6">Manual File Upload</h2>
      
      @if (hasAccess()) {
        <form (ngSubmit)="onSubmit()" class="space-y-6">
          
          <div>
            <label class="block text-sm font-medium mb-2">Topic Name</label>
            <input 
              type="text" 
              [(ngModel)]="topic" 
              name="topic" 
              required
              placeholder="e.g. users, transactions"
              class="w-full bg-background border border-border rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Source File (CSV / XLSX)</label>
            <input 
              type="file" 
              (change)="onFileSelected($event)" 
              accept=".csv,.xlsx" 
              required
              class="w-full bg-background border border-border rounded px-4 py-2 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>

          @if (message()) {
            <div [class]="'p-4 rounded-md text-sm ' + (isError() ? 'bg-destructive/20 text-destructive border border-destructive/50' : 'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/50')">
              {{ message() }}
            </div>
          }

          <button 
            type="submit" 
            [disabled]="!topic() || !selectedFile() || isUploading()"
            class="w-full py-2 px-4 rounded font-tron uppercase text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isUploading() ? 'Uploading...' : 'Upload File' }}
          </button>
        </form>
      } @else {
        <div class="p-6 bg-destructive/10 text-destructive border border-destructive/50 rounded-lg text-center font-medium">
          Access Denied. Only ADMIN or USER roles can upload files.
        </div>
      }
    </div>
  `
})
export class UploadComponent {
  private http = inject(HttpClient);
  public authService = inject(AuthService);

  topic = signal('');
  selectedFile = signal<File | null>(null);
  
  isUploading = signal(false);
  message = signal('');
  isError = signal(false);

  hasAccess(): boolean {
    const roles = this.authService.roles();
    return roles.includes('ADMIN') || roles.includes('USER');
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile.set(input.files[0]);
    } else {
      this.selectedFile.set(null);
    }
  }

  onSubmit() {
    const file = this.selectedFile();
    const topicValue = this.topic();
    
    if (!file || !topicValue) return;

    this.isUploading.set(true);
    this.message.set('');
    this.isError.set(false);

    const formData = new FormData();
    formData.append('topic', topicValue);
    formData.append('file', file);

    this.http.post('/api/v1/jobs/upload/source_file', formData).subscribe({
      next: () => {
        this.isUploading.set(false);
        this.message.set('File uploaded successfully!');
        
        // Reset form
        this.topic.set('');
        this.selectedFile.set(null);
        // We'd ideally reset the file input visually too, but for simplicity this works
      },
      error: (err) => {
        this.isUploading.set(false);
        this.isError.set(true);
        this.message.set(err.error?.error || 'Failed to upload file.');
      }
    });
  }
}
