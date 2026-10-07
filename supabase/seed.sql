-- Local development demo data (runs on `supabase db reset` only, never on a
-- remote project). All people and companies are fictional.

insert into public.showcases
  (id, slug, status, featured, title, summary, image_url, links, tags, company,
   alumni_name, alumni_role, programme, graduation_year, contact_method, contact_url)
values
  ('00000000-0000-4000-8000-000000000001', 'lumen-realtime-energy-dashboard', 'approved', true,
   'Lumen: een realtime energiedashboard',
   'Huishoudens zien hun stroomverbruik live, tot op het apparaat. Gebouwd met Vue, WebSockets en veel liefde voor kleine animaties.',
   '/seed/lumen.svg',
   '[{"label":"Livedemo","url":"https://example.com/lumen"},{"label":"Casestudy","url":"https://example.com/lumen/case"},{"label":"Broncode","url":"https://github.com/example/lumen"}]',
   '{Vue,Data viz,IoT}', 'Voltwise', 'Sanne de Vries', 'Frontend Engineer', 'Informatica', 2019,
   'linkedin', 'https://www.linkedin.com/in/example-sanne'),

  ('00000000-0000-4000-8000-000000000002', 'pocket-pharmacist', 'approved', true,
   'Pocket Pharmacist',
   'Een medicatie-app die verwarrende bijsluiters omzet in vriendelijke herinneringen en een helder dagplan.',
   '/seed/pocket.svg',
   '[{"label":"App Store","url":"https://example.com/pocket"},{"label":"Het maakproces","url":"https://example.com/pocket/making-of"}]',
   '{Flutter,Healthtech,UX}', 'Mediflow', 'Jasper Bakker', 'Mobile Developer', 'Technische Informatica', 2020,
   'email', null),

  ('00000000-0000-4000-8000-000000000003', 'harbor-eye-vessel-tracking', 'approved', false,
   'Harbor Eye: scheepsvolging',
   'Live posities, aankomsttijden en drukteverwachtingen voor 4.000 schepen, zodat planners een haven in beweging houden.',
   '/seed/harbor.svg',
   '[{"label":"Productpagina","url":"https://example.com/harbor-eye"}]',
   '{Maps,Streaming,Python}', 'Portwise Logistics', 'Mark Hendriks', 'Data Engineer', 'Business IT & Management', 2018,
   'linkedin', 'https://www.linkedin.com/in/example-mark'),

  ('00000000-0000-4000-8000-000000000004', 'greenhouse-whisperer', 'approved', false,
   'Greenhouse Whisperer',
   'Zuinige sensornodes die het klimaat van elke kas leren kennen en telers laten weten wanneer een raam open moet, voordat de planten erom vragen.',
   '/seed/greenhouse.svg',
   '[{"label":"Projectsite","url":"https://example.com/greenhouse"},{"label":"Demovideo","url":"https://example.com/greenhouse/video"}]',
   '{IoT,Embedded,ML}', 'AgriNode', 'Lotte van Dijk', 'Embedded Engineer', 'Technische Informatica', 2021,
   'website', 'https://example.com/lotte'),

  ('00000000-0000-4000-8000-000000000005', 'mindful-moments', 'approved', false,
   'Mindful Moments',
   'Een gesprekscoach die medewerkers aanmoedigt tot korte, wetenschappelijk onderbouwde pauzes tijdens de werkdag.',
   '/seed/mindful.svg',
   '[{"label":"Probeer het","url":"https://example.com/mindful"}]',
   '{AI,Chat,Wellbeing}', 'Voltwise', 'Daan Peeters', 'Product Engineer', 'Informatica', 2022,
   'linkedin', 'https://www.linkedin.com/in/example-daan'),

  ('00000000-0000-4000-8000-000000000006', 'shield-scan', 'approved', false,
   'Shield Scan',
   'Geautomatiseerde scans van het aanvalsoppervlak die bevindingen in gewone taal uitleggen, zodat teams ze ook echt oplossen.',
   '/seed/shield.svg',
   '[{"label":"Website","url":"https://example.com/shield"},{"label":"Verslag","url":"https://example.com/shield/blog"}]',
   '{Security,Go,Automation}', 'Brightbyte Security', 'Yara El Amrani', 'Security Engineer', 'Informatica', 2017,
   'linkedin', 'https://www.linkedin.com/in/example-yara'),

  ('00000000-0000-4000-8000-000000000007', 'city-pulse', 'approved', false,
   'City Pulse',
   'Een open-datakaart die uur voor uur laat zien waar een stad druk, rustig, lawaaiig of groen is.',
   '/seed/citypulse.svg',
   '[{"label":"Verken de kaart","url":"https://example.com/citypulse"}]',
   '{Maps,Open data,Nuxt}', 'Civic Labs', 'Thijs Smits', 'Full-stack Developer', 'Business IT & Management', 2020,
   'website', 'https://example.com/thijs'),

  ('00000000-0000-4000-8000-000000000008', 'blockstack-studio', 'approved', false,
   'Blockstack Studio',
   'Een 3D-bouwer in de browser waarmee niet-ontwerpers in minuten productvisualisaties samenstellen.',
   '/seed/cubic.svg',
   '[{"label":"Studio","url":"https://example.com/blockstack"},{"label":"Galerij","url":"https://example.com/blockstack/gallery"}]',
   '{WebGL,3D,TypeScript}', 'Cubic Studio', 'Noor Jansen', 'Creative Technologist', 'Communication & Multimedia Design', 2019,
   'linkedin', 'https://www.linkedin.com/in/example-noor'),

  ('00000000-0000-4000-8000-000000000009', 'retail-radar', 'approved', false,
   'Retail Radar',
   'Inzichten op schapniveau voor filiaalmanagers: wat verkoopt, wat blijft liggen en wat je vóór vrijdag moet bijbestellen.',
   '/seed/retail.svg',
   '[{"label":"Producttour","url":"https://example.com/retail-radar"}]',
   '{Analytics,React,Retail}', 'Noordzee Retail', 'Bas Verhoeven', 'Analytics Engineer', 'Business IT & Management', 2016,
   'email', null),

  ('00000000-0000-4000-8000-000000000010', 'smart-queue', 'pending', false,
   'Smart Queue',
   'Virtueel in de rij staan voor evenementen en praktijken, zodat niemand hoeft te wachten in een rij.',
   '/seed/queue.svg',
   '[{"label":"Demo","url":"https://example.com/smart-queue"}]',
   '{Realtime,Mobile}', 'Civic Labs', 'Eva Mulder', 'Software Engineer', 'Informatica', 2023,
   'email', null);

insert into public.showcase_contacts (showcase_id, email)
select id, 'alumnus-' || right(id::text, 2) || '@example.com' from public.showcases;

-- Stagger approval dates so the "newest" ordering is meaningful.
update public.showcases s
set approved_at = now() - (n.rn * interval '2 days')
from (
  select id, row_number() over (order by id) as rn
  from public.showcases where status = 'approved'
) n
where s.id = n.id;
