# Task Manager

> A quiet, precise ledger for the things that matter — plain HTML, CSS and JavaScript on top of the Supabase REST API.

| | |
|---|---|
| **Student** | Ominakavsar Abduganieva |
| **Vistula student ID** | `74026` |
| **GitHub** | [okavsar9-boop](https://github.com/okavsar9-boop) |
| **Course** | Team Project – IT (Practical Assignment 1) |

## Live links

- **Application:** https://okavsar9-boop.github.io/vistula-task-manager/
- **Contributor page:** https://okavsar9-boop.github.io/vistula-task-manager/contribution.html
- **Contributor JSON:** https://okavsar9-boop.github.io/vistula-task-manager/contribution.json
- **Repository:** https://github.com/okavsar9-boop/vistula-task-manager

## Team collaboration (Pull Requests)

| Direction | Link |
|---|---|
| PR **received** and merged in my repository | _add link here_ |
| PR **I created** in my partner's repository | _add link here_ |

## Features

- Create, read, update and delete tasks (title, description, status)
- Instant completion toggle with live progress ring
- Filter by All / Active / Completed
- Clear error messages for every failed operation
- Responsive, accessible UI (keyboard focus, ARIA live regions, reduced-motion support)
- Safe rendering via `textContent` — no HTML injection

## Tech stack

HTML · CSS · JavaScript (`fetch`) · Git & GitHub · GitHub Pages · Supabase (PostgreSQL + auto-generated REST API)

## REST API used

Base URL: `https://PROJECT_ID.supabase.co/rest/v1`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/tasks?select=*&order=id.asc` | List tasks |
| GET | `/tasks?id=eq.1&select=*` | Get one task |
| POST | `/tasks` | Create |
| PATCH | `/tasks?id=eq.1` | Update (edit / toggle) |
| DELETE | `/tasks?id=eq.1` | Delete |

## Database

Table `tasks` (`id` bigint PK identity, `title` text not null, `description` text, `completed` boolean default false) with public demo RLS policies. See [`supabase-setup.sql`](supabase-setup.sql).

## Security

Only the **public publishable key** is in `config.json`. No secret/service-role keys or database passwords are stored in this repository. The database contains demonstration data only.

## Project structure

```
index.html            main page
style.css             design
app.js                application logic + REST calls
config.json           public Supabase configuration
supabase-setup.sql    table + RLS policies
contribution.html     added by partner via Pull Request
contribution.json     added by partner via Pull Request
```
