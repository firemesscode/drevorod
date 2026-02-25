-- Добавляем колонку отчества в таблицу людей
ALTER TABLE public.people ADD COLUMN IF NOT EXISTS middle_name text;

-- Комментарий к колонке для ясности
COMMENT ON COLUMN public.people.middle_name IS 'Отчество';
