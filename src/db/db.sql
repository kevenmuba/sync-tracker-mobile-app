create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text check (role in ('super_admin','project_admin','team_member')) default 'team_member',
  avatar_url text,
  created_at timestamp default now()
);

-- Table to track hours spent on tasks
create table if not exists public.time_logs (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references public.tasks(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  hours decimal not null,
  message text,
  created_at timestamp default now()
);


create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  created_by uuid references public.users(id) on delete cascade,
  project_admin uuid references public.users(id),
  status text default 'active',
  created_at timestamp default now(),
  estimated_end_date timestamp default (now() + interval '1 month'),
  admin_accepted boolean default false
);

create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade,
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamp default now()
);

create table tasks (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  responsible_owner uuid references public.users(id),
  status text check (status in ('pending','in_sync','blocked','help_requested','completed')) default 'pending',
  progress integer default 0 check (progress >= 0 and progress <= 100),
  created_at timestamp default now()
);

create table participants (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references public.users(id),
  role text check (role in ('contributor','helper','reviewer')),
  created_at timestamp default now()
);

create table sync_logs (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references public.users(id),
  status text,
  message text,
  created_at timestamp default now()
);

-- Enable real-time for notifications and projects
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table projects;


-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sync-tracker-assets', 'sync-tracker-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow Public Access (So everyone can see profile photos)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'sync-tracker-assets' );

-- 3. Allow Authenticated Uploads (Users can upload to their own folder)
CREATE POLICY "Allow Authenticated Uploads" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'sync-tracker-assets' );

-- 4. Allow Users to Update/Delete their own files
CREATE POLICY "Allow Individual Updates" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING ( bucket_id = 'sync-tracker-assets' );

-- RLS for time_logs
ALTER TABLE public.time_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own time logs"
ON public.time_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own time logs"
ON public.time_logs FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all time logs"
ON public.time_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('super_admin', 'project_admin')
  )
);
