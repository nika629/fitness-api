import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API } from './api';
import { Exercise, ExerciseInput } from './models';

export interface ExerciseFilter {
  muscleGroupId?: number | null;
  equipmentId?: number | null;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API}/Exercise`;

  list(filter: ExerciseFilter = {}) {
    let params = new HttpParams();
    if (filter.muscleGroupId) params = params.set('muscleGroupId', filter.muscleGroupId);
    if (filter.equipmentId) params = params.set('equipmentId', filter.equipmentId);
    if (filter.search?.trim()) params = params.set('search', filter.search.trim());
    return this.http.get<Exercise[]>(`${this.url}/exercises`, { params });
  }

  get(id: number) {
    return this.http.get<Exercise>(`${this.url}/${id}`);
  }

  create(body: ExerciseInput) {
    return this.http.post<Exercise>(`${this.url}/exercise`, body);
  }

  update(id: number, body: Partial<ExerciseInput>) {
    return this.http.put<Exercise>(`${this.url}/${id}`, body);
  }

  delete(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
