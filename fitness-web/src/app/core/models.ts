// Shapes of the JSON the API sends and receives (camelCase, like ASP.NET Core returns it)

export interface AuthResponse {
  token: string;
  userID: number;
  userName: string;
  userEmail: string;
  role: string;
}

export interface Session extends AuthResponse {
  /** Token expiry as a Unix timestamp in seconds */
  exp: number;
}

export interface LoginRequest {
  userEmail: string;
  userPassword: string;
}

export interface RegisterRequest {
  userName: string;
  userLastname: string;
  userEmail: string;
  userPhone: string;
  userPassword: string;
}

export interface DictionaryItem {
  dictionaryID: number;
  dictionaryGroupIntCode: number | null;
  dictionaryCaption: string;
  dictionaryItemIntCode: number | null;
  dictionaryParentID: number | null;
}

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Exercise {
  exerciseID: number;
  exerciseName: string;
  exerciseDescription: string;
  exerciseDifficulty: string;
  muscleGroupID: number;
  muscleGroupName: string | null;
  equipmentID: number | null;
  equipmentName: string | null;
  createAt: string;
  updatedAt: string | null;
}

export interface ExerciseInput {
  exerciseName: string;
  exerciseDescription: string;
  exerciseDifficulty: string;
  muscleGroupID: number;
  equipmentID: number | null;
}

export interface WorkoutPlan {
  workoutPlanID: number;
  workoutPlanName: string;
  workoutPlanDescription: string;
  userId: number;
  exerciseCount: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface WorkoutPlanInput {
  workoutPlanName: string;
  workoutPlanDescription: string;
}

export interface WorkoutExercise {
  workoutExerciseID: number;
  sets: number;
  reps: number;
  restTime: number;
  orderNumber: number;
  workoutPlanID: number;
  exerciseID: number;
  exerciseName: string;
}

export interface WorkoutExerciseInput {
  workoutPlanID: number;
  exerciseID: number;
  sets: number;
  reps: number;
  restTime: number;
  orderNumber: number;
}

export interface WorkoutExerciseUpdate {
  sets?: number;
  reps?: number;
  restTime?: number;
  orderNumber?: number;
}

export interface FavoriteExercise {
  exerciseID: number;
  exerciseName: string;
  exerciseDescription: string;
  exerciseDifficulty: string;
  muscleGroupName: string | null;
  equipmentName: string | null;
}

export interface FoodLog {
  foodLogID: number;
  foodName: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  consumedAt: string;
  userID: number;
}

export interface FoodLogInput {
  foodName: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  consumedAt?: string;
}

export interface UserProfile {
  userID: number;
  userName: string;
  userLastName: string;
  userEmail: string;
  userPhone: string;
  userRoleName: string;
  userAge: number | null;
  birthDate: string | null;
  height: number | null;
  currentWeight: number | null;
  goalWeight: number | null;
  createdAt: string | null;
}

export interface UserUpdate {
  userName?: string;
  userLastName?: string;
  userPhone?: string;
  userAge?: number | null;
  birthDate?: string | null;
  height?: number | null;
  currentWeight?: number | null;
  goalWeight?: number | null;
}

export interface Macros {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

/** Dictionary group codes on the backend */
export const DictionaryGroup = {
  Roles: 1,
  Equipment: 2,
  MuscleGroups: 3,
} as const;

export const DIFFICULTIES: Difficulty[] = ['Beginner', 'Intermediate', 'Advanced'];

// ----- Workout history (finished workouts) -----

export interface WorkoutSessionSet {
  workoutSessionSetID: number;
  exerciseID: number;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightKg: number | null;
}

export interface WorkoutSession {
  workoutSessionID: number;
  userID: number;
  workoutPlanID: number | null;
  planName: string;
  startedAt: string;
  finishedAt: string;
  durationMinutes: number;
  notes: string | null;
  totalSets: number;
  totalReps: number;
  totalVolumeKg: number;
  /** Only filled when one session is requested */
  sets: WorkoutSessionSet[];
}

export interface WorkoutSessionInput {
  workoutPlanID: number | null;
  startedAt: string;
  finishedAt: string;
  notes?: string | null;
  sets: { exerciseID: number; setNumber: number; reps: number; weightKg: number | null }[];
}

// ----- Body weight history -----

export interface WeightLog {
  weightLogID: number;
  userID: number;
  weight: number;
  loggedAt: string;
}
