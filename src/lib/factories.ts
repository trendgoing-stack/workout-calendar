import type {
  ExerciseEntry,
  ISODate,
  Routine,
  RoutineExercise,
  WorkoutSession,
  WorkoutSet,
} from '../types'
import { createId, nowIso } from './id'

/** 空の入力値を作るファクトリ群 */

export function createSet(prev?: WorkoutSet): WorkoutSet {
  // 直前のセットがあれば重量・回数を引き継ぐ（入力を減らすため）
  return { id: createId(), weight: prev?.weight ?? null, reps: prev?.reps ?? null }
}

export function createExercise(partial?: Partial<ExerciseEntry>): ExerciseEntry {
  return {
    id: createId(),
    name: '',
    muscleGroupIds: [],
    sets: [createSet()],
    memo: '',
    ...partial,
  }
}

export function createSession(date: ISODate): WorkoutSession {
  const timestamp = nowIso()
  return {
    id: createId(),
    date,
    exercises: [createExercise()],
    memo: '',
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

export function createRoutineExercise(
  partial?: Partial<RoutineExercise>,
): RoutineExercise {
  return {
    id: createId(),
    name: '',
    muscleGroupIds: [],
    sets: [{ weight: null, reps: null }],
    memo: '',
    ...partial,
  }
}

export function createRoutine(): Routine {
  const timestamp = nowIso()
  return {
    id: createId(),
    name: '',
    description: '',
    exercises: [createRoutineExercise()],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

/** ルーティンから、その日の記録用セッションを作る */
export function sessionFromRoutine(routine: Routine, date: ISODate): WorkoutSession {
  const timestamp = nowIso()
  return {
    id: createId(),
    date,
    exercises: routine.exercises.map((exercise) => ({
      id: createId(),
      name: exercise.name,
      muscleGroupIds: [...exercise.muscleGroupIds],
      sets:
        exercise.sets.length > 0
          ? exercise.sets.map((set) => ({
              id: createId(),
              weight: set.weight,
              reps: set.reps,
            }))
          : [createSet()],
      memo: exercise.memo,
    })),
    memo: routine.name,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

/** 既存のセッションからルーティンを作る */
export function routineFromSession(session: WorkoutSession, name: string): Routine {
  const timestamp = nowIso()
  return {
    id: createId(),
    name,
    description: '',
    exercises: session.exercises.map((exercise) => ({
      id: createId(),
      name: exercise.name,
      muscleGroupIds: [...exercise.muscleGroupIds],
      sets: exercise.sets.map((set) => ({ weight: set.weight, reps: set.reps })),
      memo: exercise.memo,
    })),
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

/** 保存前に空の種目・空のセットを取り除く */
export function pruneSession(session: WorkoutSession): WorkoutSession {
  return {
    ...session,
    exercises: session.exercises
      .map((exercise) => ({
        ...exercise,
        name: exercise.name.trim(),
        sets: exercise.sets.filter(
          (set) => set.weight !== null || set.reps !== null,
        ),
      }))
      .filter((exercise) => exercise.name.length > 0),
  }
}

/** 保存に値する内容が入っているか */
export function isSessionEmpty(session: WorkoutSession): boolean {
  const pruned = pruneSession(session)
  return pruned.exercises.length === 0 && pruned.memo.trim().length === 0
}
