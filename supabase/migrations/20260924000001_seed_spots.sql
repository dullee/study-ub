-- data/initialSpots.ts-ийн 6 газрыг хүснэгтэд нэмнэ. Хүснэгтэд газар байвал юу ч хийхгүй.

insert into public.spots (name, location, hours, lat, lng, tags, wifi_speed, quiet_score, socket_score, is_24h, image, status)
select * from (values
  ('Их Нацагдоржийн Номын Сан', 'Улаанбаатар, Сүхбаатар дүүрэг', '09:00 - 20:00', 47.917, 106.91,
   array['Маш чимээгүй', 'Розетка ихтэй', 'Номын сан'], '40 Mbps', '4.8/5', 'Ихтэй', false,
   'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&auto=format&fit=crop', 'approved'),
  ('UBean Coffee Roasters', 'Хүүхдийн Паркийн баруун талд', '08:00 - 22:00', 47.9135, 106.9205,
   array['Wi-Fi хурдан', 'Розетка ихтэй'], '85 Mbps', '3.5/5', 'Ширээ бүрт', false,
   'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop', 'approved'),
  ('24/7 Study Hub UB', 'МУИС-ийн 2-р байрны дэргэд', '24 Цаг', 47.922, 106.918,
   array['24 цаг', 'Розетка ихтэй', 'Wi-Fi хурдан', 'Маш чимээгүй'], '90 Mbps', '4.5/5', 'Ихтэй (Ширээ бүрт)', true,
   'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?w=600&auto=format&fit=crop', 'approved'),
  ('Central Tower Coffee', 'Сүхбаатарын талбай, Central Tower', '08:00 - 22:00', 47.9184, 106.9201,
   array['Wi-Fi хурдан', 'Розетка ихтэй'], '70 Mbps', '3.0/5', 'Дунд', false,
   'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&auto=format&fit=crop', 'approved'),
  ('МУИС-ийн Номын Сан', 'Их сургуулийн гудамж, МУИС', '09:00 - 18:00', 47.9236, 106.9332,
   array['Номын сан', 'Маш чимээгүй', 'Розетка ихтэй'], '50 Mbps', '4.7/5', 'Ихтэй', false,
   'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&auto=format&fit=crop', 'approved'),
  ('ШУТИС-ийн Номын Сан', 'Бага тойруу, ШУТИС', '09:00 - 20:00', 47.9148, 106.9056,
   array['Номын сан', 'Розетка ихтэй', 'Wi-Fi хурдан'], '60 Mbps', '4.2/5', 'Ихтэй', false,
   'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600&auto=format&fit=crop', 'approved')
) as seed
where not exists (select 1 from public.spots);
