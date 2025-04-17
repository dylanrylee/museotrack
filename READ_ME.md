Starting the whole application

```
frontend: npm start
backend: python manage.py server
MySQL: 
```

Connecting the MySQL to the museotrack_schema.sql

```bash
cd path/to/backend/core/sql
mysql -u root -p

CREATE DATABASE museotrack_db;
USE museotrack_db;

mysql -u root -p museotrack_db < museotrack_schema.sql (only CMD supports this)

# **Double check if the tables do exist:**
mysql -u user -p
USE museotrack_db;
SHOW TABLES;
```

Only need to worry about these files:

```
api/views.py	🔥 Main workspace — write your raw SQL + REST API logic here

api/urls.py	📍 Route your endpoints here (e.g. /api/museums/, /api/login/)

backend/urls.py	🔗 One-time setup to include('api.urls')

backend/settings.py	⚙️ Config: DB settings, installed apps, CORS, etc.
```

Current accounts right now:

```
visitors:
	dylan@gmail.com - dylan
	dylanrylee@gmail.com - dylan
	
supervisors:
```