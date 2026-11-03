import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Role, UserDetail } from '../models/user.model';
import { Service } from '@angular/core';

@Service({
  autoProvided: true
})
export class RbacService {
  private http = inject(HttpClient);

  getUsers(): Observable<User[]> {
    return this.http.get<User[]>('/api/v1/iam/users');
  }

  getUser(id: number): Observable<UserDetail> {
    return this.http.get<UserDetail>(`/api/v1/iam/users/${id}`);
  }

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>('/api/v1/iam/roles');
  }

  addUser(user: Partial<User>): Observable<{ id: number }> {
    return this.http.post<{ id: number }>('/api/v1/iam/users', user);
  }

  /** Replaces all role assignments of the user. */
  assignRoles(userId: number, roleIds: number[]): Observable<void> {
    return this.http.post<void>('/api/v1/iam/assign-role', { user_id: userId, role_ids: roleIds });
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
