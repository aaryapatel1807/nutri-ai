-- Add composite indexes for the hottest per-user time-range queries
-- (today/weekly/history). Index-only migration: CREATE INDEX IF NOT EXISTS
-- is safe to apply even if the schema was previously converged with db push.
-- NOTE: this migration does NOT create the tables added after the 2026-05-26
-- init migration (WorkoutExercise, SleepLog, ConnectedAccount, RefreshToken,
-- PasswordResetToken, OAuthState, AiUsage, ChatMessage, ...). Production was
-- converged with `prisma db push`, so `prisma migrate deploy` on a fresh DB
-- would still miss those tables. Before relying on migrate for a new
-- environment, generate a full baseline migration from the live schema
-- (prisma migrate diff --from-url <live> --to-schema-datamodel schema.prisma)
-- and apply it first. See Phase 3 report.
CREATE INDEX IF NOT EXISTS "Meal_userId_date_idx" ON "Meal"("userId", "date");
CREATE INDEX IF NOT EXISTS "Workout_userId_completedAt_idx" ON "Workout"("userId", "completedAt");
CREATE INDEX IF NOT EXISTS "WorkoutExercise_workoutId_idx" ON "WorkoutExercise"("workoutId");
CREATE INDEX IF NOT EXISTS "WaterLog_userId_date_idx" ON "WaterLog"("userId", "date");
CREATE INDEX IF NOT EXISTS "WeightLog_userId_date_idx" ON "WeightLog"("userId", "date");
