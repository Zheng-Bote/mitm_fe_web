import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';

import { HlmButton } from '@spartan-ng/helm/button';
import { HlmLabel } from '@spartan-ng/helm/label';
import { HlmInput } from '@spartan-ng/helm/input';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, HlmButton, HlmLabel, HlmInput],
  template: `
    <div class="max-w-2xl mx-auto p-6 bg-card text-card-foreground shadow-lg rounded-xl border border-border mt-8">
      <h2 class="text-2xl font-bold font-tron text-primary mb-6">Manual File Upload</h2>
      
      @if (hasAccess()) {
        <form (ngSubmit)="onSubmit()" class="space-y-6">
          
          <div>
            <label hlmLabel class="mb-2" for="upload-topic">Topic Name</label>
            <input hlmInput id="upload-topic"
              type="text" 
              [(ngModel)]="topic" 
              name="topic" 
              required
              placeholder="e.g. users, transactions"
            />
          </div>

          <div>
            <label hlmLabel class="mb-2" for="upload-file">Source File (CSV / XLSX)</label>
            <input hlmInput id="upload-file"
              type="file" 
              (change)="onFileSelected($event)" 
              accept=".csv,.xlsx" 
              required
            />
          </div>

          @if (message()) {
            <div [class]="'p-4 rounded-md text-sm ' + (isError() ? 'bg-destructive/20 text-destructive border border-destructive/50' : 'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/50')">
              {{ message() }}
            </div>
          }

          <button hlmBtn
            type="submit"
            class="w-full font-tron uppercase"
            [disabled]="!topic() || !selectedFile() || isUploading()"
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
