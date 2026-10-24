import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API } from './api';
import { UserProfile, UserUpdate } from './models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API}/User`;

  me() {
    return this.http.get<UserProfile>(`${this.url}/me`);
  }

  all() {
    return this.http.get<UserProfile[]>(this.url);
  }

  update(userId: number, body: UserUpdate) {
    return this.http.put<UserProfile>(`${this.url}/${userId}`, body);
  }

  changeEmail(userId: number, newEmail: string, currentPassword: string) {
    return this.http.put<boolean>(`${this.url}/${userId}/email`, { newEmail, currentPassword });
  }

  changePassword(userId: number, currentPassword: string, newPassword: string, confirmNewPassword: string) {
    return this.http.put<boolean>(`${this.url}/${userId}/password`, {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
  }

  assignRole(userId: number, roleId: number) {
    return this.http.put<boolean>(`${this.url}/${userId}/assignRole`, null, { params: { roleID: roleId } });
  }

  delete(userId: number) {
    return this.http.delete<void>(`${this.url}/${userId}`);
  }
}
