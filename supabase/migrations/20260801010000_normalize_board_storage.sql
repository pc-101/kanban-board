alter table public.boards
add column if not exists title text;

alter table public.boards
add column if not exists color text;

update public.boards
set
  title = coalesce(title, data->>'boardTitle', id),
  color = coalesce(color, data->>'boardColor', '#0ea5e9')
where title is null or color is null;

alter table public.boards
alter column title set not null;

alter table public.boards
alter column color set not null;

create table if not exists public.board_columns (
  id text not null,
  board_id text not null references public.boards(id) on delete cascade,
  title text not null,
  position integer not null,
  updated_at timestamptz not null default now(),
  primary key (board_id, id)
);

create index if not exists board_columns_board_position_idx
on public.board_columns(board_id, position);

create table if not exists public.board_tasks (
  id text not null,
  board_id text not null references public.boards(id) on delete cascade,
  column_id text not null,
  position integer not null,
  title text not null,
  assignee text,
  description text,
  due_date text,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (board_id, id),
  foreign key (board_id, column_id) references public.board_columns(board_id, id) on delete cascade
);

create index if not exists board_tasks_column_position_idx
on public.board_tasks(column_id, position);

create table if not exists public.board_assignees (
  board_id text not null references public.boards(id) on delete cascade,
  name text not null,
  color text not null,
  position integer not null,
  updated_at timestamptz not null default now(),
  primary key (board_id, name)
);

create index if not exists board_assignees_board_position_idx
on public.board_assignees(board_id, position);

do $$
declare
  board_record record;
  column_record record;
  task_record record;
  assignee_record record;
begin
  for board_record in
    select id, data from public.boards
  loop
    for column_record in
      select value, ordinality - 1 as position
      from jsonb_array_elements(coalesce(board_record.data->'columns', '[]'::jsonb))
      with ordinality
    loop
      insert into public.board_columns (id, board_id, title, position)
      values (
        column_record.value->>'id',
        board_record.id,
        column_record.value->>'title',
        column_record.position
      )
      on conflict (board_id, id) do nothing;

      for task_record in
        select value #>> '{}' as id, ordinality - 1 as position
        from jsonb_array_elements(coalesce(column_record.value->'taskIds', '[]'::jsonb))
        with ordinality
      loop
        insert into public.board_tasks (
          id,
          board_id,
          column_id,
          position,
          title,
          assignee,
          description,
          due_date,
          completed_at
        )
        select
          task_record.id,
          board_record.id,
          column_record.value->>'id',
          task_record.position,
          task_data->>'title',
          nullif(task_data->>'assignee', ''),
          nullif(task_data->>'description', ''),
          nullif(task_data->>'dueDate', ''),
          nullif(task_data->>'completedAt', '')::timestamptz
        from (
          select board_record.data->'tasks'->task_record.id as task_data
        ) source
        where task_data is not null
        on conflict (board_id, id) do nothing;
      end loop;
    end loop;

    for assignee_record in
      select value #>> '{}' as name, ordinality - 1 as position
      from jsonb_array_elements(coalesce(board_record.data->'assignees', '[]'::jsonb))
      with ordinality
    loop
      insert into public.board_assignees (board_id, name, color, position)
      values (
        board_record.id,
        assignee_record.name,
        coalesce(board_record.data->'assigneeColors'->>assignee_record.name, '#64748b'),
        assignee_record.position
      )
      on conflict (board_id, name) do nothing;
    end loop;
  end loop;
end
$$;

alter table public.board_columns enable row level security;
alter table public.board_tasks enable row level security;
alter table public.board_assignees enable row level security;

create policy "Allow anon board column access"
on public.board_columns
for all
to anon
using (true)
with check (true);

create policy "Allow anon board task access"
on public.board_tasks
for all
to anon
using (true)
with check (true);

create policy "Allow anon board assignee access"
on public.board_assignees
for all
to anon
using (true)
with check (true);

grant select, insert, update, delete on public.board_columns to anon;
grant select, insert, update, delete on public.board_tasks to anon;
grant select, insert, update, delete on public.board_assignees to anon;

create or replace function public.apply_board_patch(
  p_board_id text,
  p_snapshot jsonb,
  p_patch jsonb
)
returns timestamptz
language plpgsql
set search_path = public
as $$
declare
  changed_at timestamptz := now();
  item jsonb;
  deleted_id text;
begin
  insert into public.boards (id, data, title, color, updated_at)
  values (
    p_board_id,
    p_snapshot,
    p_snapshot->>'boardTitle',
    p_snapshot->>'boardColor',
    changed_at
  )
  on conflict (id) do update
  set
    data = excluded.data,
    title = case when p_patch ? 'board' then excluded.title else public.boards.title end,
    color = case when p_patch ? 'board' then excluded.color else public.boards.color end,
    updated_at = changed_at;

  for item in
    select value from jsonb_array_elements(coalesce(p_patch->'columns', '[]'::jsonb))
  loop
    insert into public.board_columns (id, board_id, title, position, updated_at)
    values (
      item->>'id',
      p_board_id,
      item->>'title',
      (item->>'position')::integer,
      changed_at
    )
    on conflict (board_id, id) do update
    set
      title = excluded.title,
      position = excluded.position,
      updated_at = changed_at;
  end loop;

  for item in
    select value from jsonb_array_elements(coalesce(p_patch->'assignees', '[]'::jsonb))
  loop
    insert into public.board_assignees (board_id, name, color, position, updated_at)
    values (
      p_board_id,
      item->>'name',
      item->>'color',
      (item->>'position')::integer,
      changed_at
    )
    on conflict (board_id, name) do update
    set
      color = excluded.color,
      position = excluded.position,
      updated_at = changed_at;
  end loop;

  for item in
    select value from jsonb_array_elements(coalesce(p_patch->'tasks', '[]'::jsonb))
  loop
    insert into public.board_tasks (
      id,
      board_id,
      column_id,
      position,
      title,
      assignee,
      description,
      due_date,
      completed_at,
      updated_at
    )
    values (
      item->>'id',
      p_board_id,
      item->>'columnId',
      (item->>'position')::integer,
      item->>'title',
      nullif(item->>'assignee', ''),
      nullif(item->>'description', ''),
      nullif(item->>'dueDate', ''),
      nullif(item->>'completedAt', '')::timestamptz,
      changed_at
    )
    on conflict (board_id, id) do update
    set
      column_id = excluded.column_id,
      position = excluded.position,
      title = excluded.title,
      assignee = excluded.assignee,
      description = excluded.description,
      due_date = excluded.due_date,
      completed_at = excluded.completed_at,
      updated_at = changed_at;
  end loop;

  for deleted_id in
    select value #>> '{}'
    from jsonb_array_elements(coalesce(p_patch->'deletedTaskIds', '[]'::jsonb))
  loop
    delete from public.board_tasks
    where public.board_tasks.board_id = p_board_id
      and public.board_tasks.id = deleted_id;
  end loop;

  for deleted_id in
    select value #>> '{}'
    from jsonb_array_elements(coalesce(p_patch->'deletedAssigneeNames', '[]'::jsonb))
  loop
    delete from public.board_assignees
    where public.board_assignees.board_id = p_board_id
      and public.board_assignees.name = deleted_id;
  end loop;

  for deleted_id in
    select value #>> '{}'
    from jsonb_array_elements(coalesce(p_patch->'deletedColumnIds', '[]'::jsonb))
  loop
    delete from public.board_columns
    where public.board_columns.board_id = p_board_id
      and public.board_columns.id = deleted_id;
  end loop;

  return changed_at;
end;
$$;

create or replace function public.import_board_snapshot(
  p_board_id text,
  p_snapshot jsonb
)
returns timestamptz
language plpgsql
set search_path = public
as $$
declare
  full_patch jsonb;
begin
  select jsonb_build_object(
    'board', jsonb_build_object(
      'title', p_snapshot->>'boardTitle',
      'color', p_snapshot->>'boardColor'
    ),
    'columns', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', column_item.value->>'id',
        'title', column_item.value->>'title',
        'position', column_item.ordinality - 1
      ))
      from jsonb_array_elements(coalesce(p_snapshot->'columns', '[]'::jsonb))
      with ordinality as column_item(value, ordinality)
    ), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(
        (p_snapshot->'tasks'->(task_item.value #>> '{}'))
        || jsonb_build_object(
          'columnId', column_item.value->>'id',
          'position', task_item.ordinality - 1
        )
      )
      from jsonb_array_elements(coalesce(p_snapshot->'columns', '[]'::jsonb))
      with ordinality as column_item(value, ordinality)
      cross join lateral jsonb_array_elements(coalesce(column_item.value->'taskIds', '[]'::jsonb))
      with ordinality as task_item(value, ordinality)
      where p_snapshot->'tasks'->(task_item.value #>> '{}') is not null
    ), '[]'::jsonb),
    'assignees', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', assignee_item.value #>> '{}',
        'color', coalesce(
          p_snapshot->'assigneeColors'->>(assignee_item.value #>> '{}'),
          '#64748b'
        ),
        'position', assignee_item.ordinality - 1
      ))
      from jsonb_array_elements(coalesce(p_snapshot->'assignees', '[]'::jsonb))
      with ordinality as assignee_item(value, ordinality)
    ), '[]'::jsonb),
    'deletedColumnIds', '[]'::jsonb,
    'deletedTaskIds', '[]'::jsonb,
    'deletedAssigneeNames', '[]'::jsonb
  ) into full_patch;

  return public.apply_board_patch(p_board_id, p_snapshot, full_patch);
end;
$$;

revoke execute on function public.apply_board_patch(text, jsonb, jsonb) from public;
grant execute on function public.apply_board_patch(text, jsonb, jsonb) to anon;
revoke execute on function public.import_board_snapshot(text, jsonb) from public;
