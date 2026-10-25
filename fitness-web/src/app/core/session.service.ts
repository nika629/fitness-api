import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API } from './api';
import { WorkoutSession, WorkoutSessionInput } from './models';

/** Finished workouts (the workout history) */
@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);

  private url(userId: number) {
    return `${API}/WorkoutSession/${userId}/workout-sessions`;
  }

  list(userId: number) {
    return this.http.get<WorkoutSession[]>(this.url(userId));
  }

  get(userId: number, sessionId: number) {
    return this.http.get<WorkoutSession>(`${this.url(userId)}/${sessionId}`);
  }

  create(userId: number, body: WorkoutSessionInput) {
    return this.http.post<WorkoutSession>(this.url(userId), body);
  }

  delete(userId: number, sessionId: number) {
    return this.http.delete<void>(`${this.url(userId)}/${sessionId}`);
  }
}
