Starting the whole application

```
frontend: npm start 
backend: python manage.py server
MySQL (if needed): 
		Win + R
		services.msc
		Right click on MySQL80
		click start
```

Stop the whole application

```
For backend and frontend: CTRL + C
MySQL: 
	Win + R
	services.msc
	Right click on MySQL80
	click stop
```

Connecting the MySQL to the museotrack_schema.sql

```
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

Current accounts right now:

```
visitors:
	dylan@gmail.com - dylan
	dylanrylee@gmail.com - dylan
	
supervisors:
	supervisor1@gmail.com - supervisor1
	
employees:
	employee11@gmail.com - employee11
```

Updating the MySQL

```
C:\Users\dylan\OneDrive\Desktop\MuseoTrack>
C:\Users\dylan\OneDrive\Desktop\MuseoTrack>mysql -u root -p museotrack_db < backend\backend\sql\museotrack_schema.sql
```
