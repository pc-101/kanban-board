alter table public.board_tasks
add column if not exists archived_at timestamptz;

create index if not exists board_tasks_pending_archive_idx
on public.board_tasks(completed_at)
where archived_at is null and completed_at is not null;

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
      archived_at,
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
      nullif(item->>'archivedAt', '')::timestamptz,
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
      archived_at = excluded.archived_at,
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

create or replace function public.archive_stale_board_tasks()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  archived_on timestamptz := now();
  affected_board_ids text[];
  archived_count integer;
begin
  select array_agg(distinct board_id)
  into affected_board_ids
  from public.board_tasks as task
  where task.archived_at is null
    and task.completed_at <= archived_on - interval '14 days'
    and exists (
      select 1
      from public.board_columns as task_column
      where task_column.board_id = task.board_id
        and task_column.id = task.column_id
        and lower(btrim(task_column.title)) = 'done'
    );

  if affected_board_ids is null then
    return 0;
  end if;

  update public.board_tasks as task
  set
    archived_at = archived_on,
    updated_at = archived_on
  where task.archived_at is null
    and task.completed_at <= archived_on - interval '14 days'
    and exists (
      select 1
      from public.board_columns as task_column
      where task_column.board_id = task.board_id
        and task_column.id = task.column_id
        and lower(btrim(task_column.title)) = 'done'
    );

  get diagnostics archived_count = row_count;

  update public.boards
  set updated_at = archived_on
  where id = any(affected_board_ids);

  return archived_count;
end;
$$;

revoke execute on function public.archive_stale_board_tasks() from public;

create extension if not exists pg_cron;

select cron.schedule(
  'archive-stale-board-tasks',
  '0 * * * *',
  'select public.archive_stale_board_tasks();'
);
