CREATE OR REPLACE FUNCTION increment_daily_usage(p_user_id UUID)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today DATE := CURRENT_DATE;
  current_count integer;
BEGIN
  INSERT INTO daily_usage (user_id, date, count)
  VALUES (p_user_id, today, 1)
  ON CONFLICT (user_id, date)
  DO UPDATE SET count = daily_usage.count + 1
  RETURNING count INTO current_count;

  RETURN current_count;
END;
$$;
