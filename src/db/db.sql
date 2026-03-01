create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text check (role in ('super_admin','project_admin','team_member')) default 'team_member',
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
