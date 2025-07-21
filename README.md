# MuseoTrack – Museums/Artifacts Tracking Website
### Created by Dylan Dizon, Keenan Hanaerin-Balczer, and Anmol Ratol

MuseoTrack is a full-stack museum management system built to streamline operations for museum staff while enhancing the experience for visitors. The platform supports multiple user roles — supervisors, employees, and visitors — and enables secure interactions such as artifact management, exhibit planning, and user reviews.

🔧 Tech Stack
Frontend: React, JavaScript, HTML/CSS

Backend: Django (REST API with raw SQL), MySQL

Authentication: JWT-based authentication for role-specific access

💡 Key Features
🔐 Multi-role login system (Visitor, Employee, Supervisor) with secure JWT authentication

🖼️ CRUD operations for managing artifacts, events, exhibits, and artists

🧠 Data planning with EER diagrams, relational schemas, and DFDs before implementation

📊 Backend powered by 30+ raw SQL endpoints across 8+ relational tables with cascade rules

🔄 Seamless React-to-Django integration using axios for real-time UI updates

📝 Review system for artifacts and events with star ratings and modal-based UI

---
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
