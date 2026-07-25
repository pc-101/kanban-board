insert into public.boards (id, data, updated_at)
values
  (
    'dev-product-launch',
    '{
      "boardTitle": "Product Launch",
      "boardColor": "#0ea5e9",
      "assignees": ["Pat", "Sam", "Alex"],
      "columns": [
        { "id": "launch-todo", "title": "Todo", "taskIds": ["draft-launch-plan", "prepare-demo"] },
        { "id": "launch-progress", "title": "In Progress", "taskIds": ["finalize-pricing"] },
        { "id": "launch-done", "title": "Done", "taskIds": ["create-brief"] }
      ],
      "tasks": {
        "draft-launch-plan": { "id": "draft-launch-plan", "title": "Draft launch plan", "assignee": "Pat", "dueDate": "2026-08-02", "description": "Outline launch milestones, channels, and owners." },
        "prepare-demo": { "id": "prepare-demo", "title": "Prepare demo script", "assignee": "Sam", "dueDate": "2026-08-05", "description": "Create a short walkthrough for the release demo." },
        "finalize-pricing": { "id": "finalize-pricing", "title": "Finalize pricing page copy", "assignee": "Alex", "description": "Review pricing language with product and marketing." },
        "create-brief": { "id": "create-brief", "title": "Create stakeholder brief", "assignee": "Pat", "description": "Summarize positioning, risks, and rollout timeline." }
      }
    }'::jsonb,
    now()
  ),
  (
    'dev-website-refresh',
    '{
      "boardTitle": "Website Refresh",
      "boardColor": "#34d399",
      "assignees": ["Mina", "Jordan", "Lee"],
      "columns": [
        { "id": "web-todo", "title": "Todo", "taskIds": ["audit-homepage", "collect-testimonials"] },
        { "id": "web-progress", "title": "In Progress", "taskIds": ["build-case-study"] },
        { "id": "web-done", "title": "Done", "taskIds": [] }
      ],
      "tasks": {
        "audit-homepage": { "id": "audit-homepage", "title": "Audit homepage content", "assignee": "Mina", "dueDate": "2026-08-09", "description": "Flag outdated sections and conversion gaps." },
        "collect-testimonials": { "id": "collect-testimonials", "title": "Collect customer testimonials", "assignee": "Jordan", "description": "Gather three short quotes for the refreshed landing page." },
        "build-case-study": { "id": "build-case-study", "title": "Build featured case study block", "assignee": "Lee", "dueDate": "2026-08-12", "description": "Create the first version of the reusable case study section." }
      }
    }'::jsonb,
    now()
  ),
  (
    'dev-ops-backlog',
    '{
      "boardTitle": "Ops Backlog",
      "boardColor": "#f59e0b",
      "assignees": ["Rae", "Chris"],
      "columns": [
        { "id": "ops-todo", "title": "Todo", "taskIds": ["triage-alerts", "document-runbook"] },
        { "id": "ops-progress", "title": "In Progress", "taskIds": [] },
        { "id": "ops-done", "title": "Done", "taskIds": ["rotate-keys"] }
      ],
      "tasks": {
        "triage-alerts": { "id": "triage-alerts", "title": "Triage stale alerts", "assignee": "Rae", "description": "Remove noisy alerts and add owners to the remaining set." },
        "document-runbook": { "id": "document-runbook", "title": "Document deploy rollback runbook", "assignee": "Chris", "dueDate": "2026-08-16", "description": "Write the rollback checklist for failed production deploys." },
        "rotate-keys": { "id": "rotate-keys", "title": "Rotate staging API keys", "assignee": "Rae", "description": "Replace staging credentials and confirm dependent services are healthy." }
      }
    }'::jsonb,
    now()
  )
on conflict (id) do update
set data = excluded.data,
    updated_at = excluded.updated_at;
