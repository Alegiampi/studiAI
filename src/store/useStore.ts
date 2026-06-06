import { create } from 'zustand'
import { createAuthSlice } from './slices/authSlice'
import { createProfileSlice } from './slices/profileSlice'
import { createUsageSlice } from './slices/usageSlice'
import { createExerciseSlice } from './slices/exerciseSlice'
import type { AuthSlice } from './slices/authSlice'
import type { ProfileSlice } from './slices/profileSlice'
import type { UsageSlice } from './slices/usageSlice'
import type { ExerciseSlice } from './slices/exerciseSlice'

type StoreState = AuthSlice & ProfileSlice & UsageSlice & ExerciseSlice

export const useStore = create<StoreState>((set, get, store) => ({
  ...createAuthSlice(set, get, store),
  ...createProfileSlice(set, get, store),
  ...createUsageSlice(set, get, store),
  ...createExerciseSlice(set, get, store),
}))

export { DAILY_LIMIT } from './slices/usageSlice'
export type { Profilo } from './slices/profileSlice'
export type { ExerciseInput, ChatMessage } from './slices/exerciseSlice'
