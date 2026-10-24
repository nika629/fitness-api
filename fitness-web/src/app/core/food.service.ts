import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API } from './api';
import { FoodLog, FoodLogInput, Macros } from './models';

@Injectable({ providedIn: 'root' })
export class FoodService {
  private readonly http = inject(HttpClient);

  list(userId: number) {
    return this.http.get<FoodLog[]>(`${API}/FoodLog/${userId}/foodLogs`);
  }

  create(userId: number, body: FoodLogInput) {
    return this.http.post<FoodLog>(`${API}/FoodLog/${userId}/foodLog`, body);
  }

  delete(userId: number, foodLogId: number) {
    return this.http.delete<void>(`${API}/FoodLog/${userId}/foodLog/${foodLogId}`);
  }
}

/** Adds up calories and macros of several food log entries */
export function sumMacros(logs: FoodLog[]): Macros {
  return logs.reduce(
    (total, log) => ({
      calories: total.calories + log.calories,
      protein: total.protein + log.protein,
      carbohydrates: total.carbohydrates + log.carbohydrates,
      fat: total.fat + log.fat,
    }),
    { calories: 0, protein: 0, carbohydrates: 0, fat: 0 },
  );
}
