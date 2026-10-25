import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API } from './api';
import { WeightLog } from './models';

/** Body weight history for the progress chart */
@Injectable({ providedIn: 'root' })
export class WeightService {
  private readonly http = inject(HttpClient);

  list(userId: number) {
    return this.http.get<WeightLog[]>(`${API}/WeightLog/${userId}/weight-logs`);
  }

  create(userId: number, weight: number) {
    return this.http.post<WeightLog>(`${API}/WeightLog/${userId}/weight-logs`, { weight });
  }
}
