-- Add recurrence_pattern to tasks (null = not recurring, or 'daily'/'weekly'/'monthly')
ALTER TABLE public.tasks ADD COLUMN recurrence_pattern TEXT DEFAULT NULL;
