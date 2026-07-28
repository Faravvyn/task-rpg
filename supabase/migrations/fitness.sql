-- Google Fit Token-Storage (supabase/migrations/fitness.sql)
-- Speichert OAuth-Tokens sicher serverseitig (client_secret nie im Frontend)

CREATE TABLE IF NOT EXISTS google_fit_tokens (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL
);

ALTER TABLE google_fit_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Fit-Tokens lesen" ON google_fit_tokens;
CREATE POLICY "Fit-Tokens lesen" ON google_fit_tokens
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Fit-Tokens schreiben" ON google_fit_tokens;
CREATE POLICY "Fit-Tokens schreiben" ON google_fit_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Fit-Tokens aktualisieren" ON google_fit_tokens;
CREATE POLICY "Fit-Tokens aktualisieren" ON google_fit_tokens
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Fit-Tokens loeschen" ON google_fit_tokens;
CREATE POLICY "Fit-Tokens loeschen" ON google_fit_tokens
  FOR DELETE USING (auth.uid() = user_id);
