-- Pinterest Integration Tables

-- Table to store Pinterest OAuth state tokens (for CSRF protection)
CREATE TABLE IF NOT EXISTS pinterest_auth_states (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    state TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Table to store Pinterest connections
CREATE TABLE IF NOT EXISTS pinterest_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pinterest_username TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add new columns to saved_recipes for Pinterest imports
ALTER TABLE saved_recipes
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS pinterest_pin_id TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_pinterest_connections_user_id ON pinterest_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_pinterest_auth_states_user_id ON pinterest_auth_states(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipes_pinterest_pin_id ON saved_recipes(pinterest_pin_id);

-- Row Level Security policies
ALTER TABLE pinterest_auth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinterest_connections ENABLE ROW LEVEL SECURITY;

-- Pinterest auth states - users can only manage their own
CREATE POLICY "Users can manage own pinterest auth states"
ON pinterest_auth_states FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Pinterest connections - users can only manage their own
CREATE POLICY "Users can manage own pinterest connections"
ON pinterest_connections FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON pinterest_auth_states TO authenticated;
GRANT ALL ON pinterest_connections TO authenticated;
