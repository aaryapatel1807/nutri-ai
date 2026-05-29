-- Users table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER,
    gender TEXT,
    height_cm DECIMAL,
    weight_kg DECIMAL,
    target_weight_kg DECIMAL,
    bmi DECIMAL,
    goal TEXT DEFAULT 'stay_fit',
    diet_type TEXT DEFAULT 'any',
    activity_level INTEGER DEFAULT 3,
    workout_days INTEGER DEFAULT 4,
    calorie_goal INTEGER DEFAULT 1800,
    protein_goal INTEGER DEFAULT 150,
    equipment TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- Gamification table
CREATE TABLE gamification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    streak INTEGER DEFAULT 0,
    last_logged DATE,
    total_workouts INTEGER DEFAULT 0,
    total_meals INTEGER DEFAULT 0,
    chat_count INTEGER DEFAULT 0,
    goal_streak INTEGER DEFAULT 0,
    UNIQUE(user_id)
);

-- Meal logs table
CREATE TABLE meal_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL,
    name TEXT NOT NULL,
    image_url TEXT,
    detected_by TEXT DEFAULT 'manual',
    calories DECIMAL DEFAULT 0,
    protein DECIMAL DEFAULT 0,
    carbs DECIMAL DEFAULT 0,
    fat DECIMAL DEFAULT 0,
    fiber DECIMAL DEFAULT 0,
    sodium DECIMAL DEFAULT 0,
    logged_at TIMESTAMP DEFAULT NOW()
);

-- Workout logs table
CREATE TABLE workout_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    focus TEXT,
    duration_min INTEGER DEFAULT 0,
    calories_burned DECIMAL DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Exercises in workout
CREATE TABLE workout_exercises (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    workout_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
    name TEXT,
    sets INTEGER,
    reps TEXT,
    weight_kg DECIMAL DEFAULT 0,
    completed BOOLEAN DEFAULT false
);

-- Badges table
CREATE TABLE badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    badge_id TEXT NOT NULL,
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Chat history table
CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only access their own data)
CREATE POLICY "Users own data" ON profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users own data" ON gamification FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON meal_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON workout_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON badges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users own data" ON chat_messages FOR ALL USING (auth.uid() = user_id);

-- Trigger: auto-create profile + gamification row when user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
    INSERT INTO gamification (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
