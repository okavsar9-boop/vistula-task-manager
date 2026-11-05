# Task Manager – Vistula Team Project

**Student:** Ominakavsar Abduganieva · **Student ID:** 74026
**GitHub:** `okavsar9-boop`

## Links
- Live app: https://okavsar9-boop.github.io/vistula-task-manager/
- Repository: https://github.com/okavsar9-boop/vistula-task-manager
- Contribution page: https://okavsar9-boop.github.io/vistula-task-manager/contribution.html
- Contribution JSON: https://okavsar9-boop.github.io/vistula-task-manager/contribution.json

## Pull Requests
- PR I created in my partner's repository (merged): https://github.com/vistula-team-project-64613/vistula-task-manager/pull/1
- PR I received and merged in this repository: https://github.com/okavsar9-boop/vistula-task-manager/pull/1

## Stack
HTML, CSS, vanilla JavaScript · Supabase (PostgreSQL + auto-generated REST API) · GitHub Pages

## REST API usage
`GET ?select=*&order=id.asc` · `POST` · `PATCH ?id=eq.{id}` · `DELETE ?id=eq.{id}` on `/rest/v1/tasks`.
Only the public publishable key is used; no secrets are stored in this repo. The table and RLS policies are in `setup.sql`.
