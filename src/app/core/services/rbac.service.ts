import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Role } from '../models/user.model';
import { Service } from '@angular/core';

@Service({
  providedIn: 'root'
})
export class RbacService {
  private http = inject(HttpClient);

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/v1/iam/users');
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>('/api/v1/iam/roles');
  }

  addUser(user: Partial<User>): Observable<void> {
    return this.http.post<void>('/api/v1/iam/users', user);
  }

  updateUser(id: number, user: Partial<User>): Observable<void> {
    return this.http.put<void>(`/api/v1/iam/users/${id}`, user);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`/api/v1/iam/users/${id}`);
  }

  terminateSession(id: number): Observable<void> {
    return this.http.delete<void>(`/api/v1/iam/users/${id}/session`);
  }
}
