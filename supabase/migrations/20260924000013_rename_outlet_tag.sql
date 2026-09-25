-- "Розетка ихтэй" шошгыг "Залгуур ихтэй" болгоно (types/index.ts-ийн AVAILABLE_TAGS).
-- Хоёулаа байвал хуучныг нь хасна. Дахин ажиллуулахад алдаа гарахгүй.

update public.spots
set tags = case
  when 'Залгуур ихтэй' = any (tags) then array_remove(tags, 'Розетка ихтэй')
  else array_replace(tags, 'Розетка ихтэй', 'Залгуур ихтэй')
end
where 'Розетка ихтэй' = any (tags);
