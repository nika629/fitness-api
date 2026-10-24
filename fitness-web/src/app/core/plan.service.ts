import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API } from './api';
import {
  WorkoutExercise,
  WorkoutExerciseInput,
  WorkoutExerciseUpdate,
  WorkoutPlan,
  WorkoutPlanInput,
} from './models';

/** Workout plans and the exercises inside them */
@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly http = inject(HttpClient);

  list(userId: number) {
    return this.http.get<WorkoutPlan[]>(`${API}/WorkoutPlan/${userId}/workout-plans`);
  }

  get(userId: number, planId: number) {
    return this.http.get<WorkoutPlan>(`${API}/WorkoutPlan/${userId}/workout-plans/${planId}`);
  }

  create(userId: number, body: WorkoutPlanInput) {
    return this.http.post<WorkoutPlan>(`${API}/WorkoutPlan/${userId}/workout-plans`, body);
  }

  update(userId: number, planId: number, body: WorkoutPlanInput) {
    return this.http.put<WorkoutPlan>(`${API}/WorkoutPlan/${userId}/workout-plans/${planId}`, body);
  }

  delete(userId: number, planId: number) {
    return this.http.delete<void>(`${API}/WorkoutPlan/${userId}/workout-plans/${planId}`);
  }

  exercises(userId: number, planId: number) {
    return this.http.get<WorkoutExercise[]>(`${API}/WorkoutExercise/${userId}/plans/${planId}/workout-exercises`);
  }

  addExercise(userId: number, body: WorkoutExerciseInput) {
    return this.http.post<WorkoutExercise>(`${API}/WorkoutExercise/${userId}/workout-exercises`, body);
  }

  updateExercise(userId: number, id: number, body: WorkoutExerciseUpdate) {
    return this.http.put<WorkoutExercise>(`${API}/WorkoutExercise/${userId}/workout-exercises/${id}`, body);
  }

  removeExercise(userId: number, id: number) {
    return this.http.delete<void>(`${API}/WorkoutExercise/${userId}/workout-exercises/${id}`);
  }
}
