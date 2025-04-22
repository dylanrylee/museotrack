from django.db import connection
from django.contrib.auth.hashers import make_password, check_password
import traceback
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .token_serializers import CustomTokenObtainPairSerializer
import random

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

# login visitor function -- checks if the visitor is in the database
@api_view(['POST'])
def login_visitor(request):
    email = request.data.get('email')
    password = request.data.get('password')

    try:
        with connection.cursor() as cursor:
            # Get hashed password from USER table
            cursor.execute("SELECT Password FROM USER WHERE Email = %s", [email])
            user = cursor.fetchone()

        if not user:
            return Response({"message": "Invalid email or password"}, status=401)

        stored_password = user[0]

        # Compare raw password to hashed version
        if not check_password(password, stored_password):
            return Response({"message": "Invalid email or password"}, status=401)

        with connection.cursor() as cursor:
            # Confirm user is a visitor
            cursor.execute("SELECT * FROM VISITOR WHERE VEmail = %s", [email])
            visitor = cursor.fetchone()

        if not visitor:
            return Response({"message": "You are not registered as a visitor"}, status=403)

        return Response({"message": "Visitor login successful"}, status=200)

    except Exception as e:
        return Response({"message": f"Server error: {str(e)}"}, status=500)

# register visitor account
@api_view(['POST'])
def register_visitor(request):
    data = request.data

    email = data.get('email')
    username = data.get('username')
    password = make_password(data.get('password'))
    first_name = data.get('firstName')
    middle_name = data.get('middleName', '')
    last_name = data.get('lastName')
    year_of_birth = data.get('yearOfBirth')

    try:
        with connection.cursor() as cursor:
            # Insert into USER
            cursor.execute("""
                INSERT INTO USER (Email, First_Name, Middle_Name, Last_Name, Username, Password, Year_of_Birth)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, [email, first_name, middle_name, last_name, username, password, year_of_birth])

            # Insert into VISITOR
            cursor.execute("""
                INSERT INTO VISITOR (VEmail)
                VALUES (%s)
            """, [email])

        return Response({"message": "Account created successfully"}, status=201)

    except Exception as e:
        return Response({"message": str(e)}, status=400)

@api_view(['POST'])
def login_supervisor_employee(request):
    email = request.data.get('email')
    password = request.data.get('password')

    try:
        with connection.cursor() as cursor:
            # Check if user exists
            cursor.execute("SELECT Password FROM USER WHERE Email = %s", [email])
            result = cursor.fetchone()

            if not result:
                return Response({"message": "Invalid email or password"}, status=401)

            hashed_pw = result[0]
            if not check_password(password, hashed_pw):
                return Response({"message": "Invalid email or password"}, status=401)

        with connection.cursor() as cursor:
            # First check supervisor
            cursor.execute("SELECT * FROM SUPERVISOR WHERE SEmail = %s", [email])
            is_supervisor = cursor.fetchone()

            # Then check employee
            cursor.execute("SELECT * FROM EMPLOYEE WHERE EEmail = %s", [email])
            is_employee = cursor.fetchone()

        if is_supervisor:
            return Response({"message": "Supervisor login success", "role": "supervisor"}, status=200)
        elif is_employee:
            return Response({"message": "Employee login success", "role": "employee"}, status=200)
        else:
            return Response({"message": "User is not a staff member"}, status=403)

    except Exception as e:
        return Response({"message": f"Server error: {str(e)}"}, status=500)

# Browse visited museums
@api_view(['GET'])
def browse_visited_museums(request):
    v_email = request.query_params.get('email')

    if not v_email:
        return Response({"message": "Missing email"}, status=400)

    try:
        with connection.cursor() as cursor:
            # Get username
            cursor.execute("SELECT Username FROM USER WHERE Email = %s", [v_email])
            user = cursor.fetchone()

            if not user:
                return Response({"message": "User not found"}, status=404)

            username = user[0]

            # Get visited museums
            cursor.execute("""
                SELECT M.Name, M.Address
                FROM VISITS AS V
                JOIN MUSEUM AS M ON V.Address = M.Address
                WHERE V.VEmail = %s
            """, [v_email])
            museums = cursor.fetchall()
            museum_data = [{"name": row[0], "address": row[1]} for row in museums]

        return Response({
            "username": username,
            "visitedMuseums": museum_data
        })

    except Exception as e:
        return Response({"message": str(e)}, status=500)

# Register account for supervisor
@api_view(['POST'])
def register_supervisor(request):
    try:
        data = request.data
        email = data.get('email')
        password = make_password(data.get('password'))
        first = data.get('firstName')
        middle = data.get('middleName')
        last = data.get('lastName')
        username = data.get('username')
        yob = data.get('yearOfBirth')
        museum_name = data.get('museumName')
        museum_address = data.get('museumAddress')

        with connection.cursor() as cursor:
            # Insert museum (ignore if already exists)
            cursor.execute("""
                INSERT IGNORE INTO MUSEUM (Address, Name)
                VALUES (%s, %s)
            """, [museum_address, museum_name])

            # Insert user
            cursor.execute("""
                INSERT INTO USER (Email, First_Name, Middle_Name, Last_Name, Username, Password, Year_of_Birth)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, [email, first, middle, last, username, password, yob])

            # Insert supervisor
            cursor.execute("""
                INSERT INTO SUPERVISOR (SEmail, MuseumAddress)
                VALUES (%s, %s)
            """, [email, museum_address])

        return Response({"message": "Supervisor registered successfully"}, status=201)

    except Exception as e:
        return Response({"message": f"Server error: {str(e)}"}, status=500)
    
@api_view(['GET'])
def get_supervisor_info(request):
    email = request.GET.get('email')

    if not email:
        return Response({"message": "Email is required"}, status=400)

    try:
        with connection.cursor() as cursor:
            # Get username and museum address from USER and SUPERVISOR
            cursor.execute("""
                SELECT U.Username, S.MuseumAddress, M.Name
                FROM USER U
                JOIN SUPERVISOR S ON U.Email = S.SEmail
                JOIN MUSEUM M ON S.MuseumAddress = M.Address
                WHERE U.Email = %s
            """, [email])

            result = cursor.fetchone()

            if not result:
                return Response({"message": "Supervisor not found"}, status=404)

            username, museum_address, museum_name = result

        return Response({
            "username": username,
            "museum": museum_name,
            "museumAddress": museum_address
        })

    except Exception as e:
        return Response({"message": f"Server error: {str(e)}"}, status=500)


@api_view(['GET'])
def get_supervisor_employees(request):
    email = request.GET.get('email')

    if not email:
        return Response({"message": "Email is required"}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT E.EEmail, U.First_Name, U.Last_Name, U.Username
                FROM EMPLOYEE E
                JOIN USER U ON E.EEmail = U.Email
                WHERE E.SEmail = %s
            """, [email])

            employees = cursor.fetchall()
            employee_list = [
                {
                    "email": e[0],
                    "firstName": e[1],
                    "lastName": e[2],
                    "username": e[3]
                }
                for e in employees
            ]

        return Response({"employees": employee_list})

    except Exception as e:
        return Response({"message": f"Server error: {str(e)}"}, status=500)


# Register account for employee
@api_view(['POST'])
def register_employee(request):
    data = request.data
    required_fields = ['email', 'username', 'firstName', 'lastName', 'password', 'yearOfBirth', 'supervisorEmail', 'museumAddress']
    
    for field in required_fields:
        if field not in data or data[field] == '':
            return Response({"message": f"Missing field: {field}"}, status=400)

    try:
        hashed_password = make_password(data['password']) 

        with connection.cursor() as cursor:
            # Add to USER
            cursor.execute("""
                INSERT INTO USER (Email, First_Name, Middle_Name, Last_Name, Username, Password, Year_of_Birth)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, [
                data['email'], data['firstName'], data.get('middleName', ''), data['lastName'],
                data['username'], hashed_password, data['yearOfBirth']
            ])

            # Add to EMPLOYEE
            cursor.execute("""
                INSERT INTO EMPLOYEE (EEmail, SEmail, MuseumAddress)
                VALUES (%s, %s, %s)
            """, [
                data['email'], data['supervisorEmail'], data['museumAddress']
            ])

        return Response({"message": "Employee registered successfully."})
    
    except Exception as e:
        return Response({"message": f"Server error: {str(e)}"}, status=500)

@api_view(["POST"])
def update_employee(request):
    email = request.data.get("email")
    new_username = request.data.get("newUsername")
    new_password = request.data.get("newPassword")

    if not email:
        return Response({"message": "Email is required."}, status=400)

    if not new_username and not new_password:
        return Response({"message": "No update fields provided."}, status=400)

    try:
        with connection.cursor() as cursor:
            if new_username:
                cursor.execute(
                    "UPDATE USER SET Username = %s WHERE Email = %s",
                    [new_username, email]
                )
            if new_password:
                hashed = make_password(new_password)
                cursor.execute(
                    "UPDATE USER SET Password = %s WHERE Email = %s",
                    [hashed, email]
                )

        return Response({"message": "Employee updated successfully."})
    except Exception as e:
        return Response({"message": f"Update failed: {str(e)}"}, status=500)

@api_view(["POST"])
def delete_employee(request):
    email = request.data.get("email")

    if not email:
        return Response({"message": "Email is required."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM USER WHERE Email = %s", [email])
        return Response({"message": "Employee deleted successfully."})
    except Exception as e:
        return Response({"message": f"Delete failed: {str(e)}"}, status=500)

@api_view(["GET"])
def get_employee_info(request):
    email = request.GET.get("email")
    if not email:
        return Response({"message": "Missing employee email."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    E.EEmail, 
                    U.Username, 
                    E.SEmail, 
                    E.MuseumAddress, 
                    M.Name
                FROM EMPLOYEE E
                JOIN USER U ON E.EEmail = U.Email
                JOIN MUSEUM M ON E.MuseumAddress = M.Address
                WHERE E.EEmail = %s
            """, [email])
            row = cursor.fetchone()

            if not row:
                return Response({"message": "Employee not found."}, status=404)

            data = {
                "email": row[0],
                "username": row[1],
                "supervisorEmail": row[2],
                "museumAddress": row[3],
                "museumName": row[4],
            }
            return Response(data)

    except Exception as e:
        return Response({"message": str(e)}, status=500)

@api_view(["GET"])
def get_artifacts(request):
    semail = request.GET.get("semail")

    if not semail:
        return Response({"message": "Missing supervisor email."}, status=400)

    try:
        with connection.cursor() as cursor:
            # Get the supervisor's museum address
            cursor.execute("SELECT MuseumAddress FROM SUPERVISOR WHERE SEmail = %s", [semail])
            row = cursor.fetchone()
            if not row:
                return Response({"message": "Supervisor not found."}, status=404)
            museum_address = row[0]

            # Get all artifacts that belong to exhibits at that museum
            cursor.execute("""
                SELECT A.* FROM ARTIFACT A
                JOIN EXHIBIT E ON A.ExID = E.ExID
                WHERE E.Address = %s
            """, [museum_address])
            artifact_rows = cursor.fetchall()
            columns = [col[0].lower() for col in cursor.description]

        artifacts = []
        for row in artifact_rows:
            artifact = dict(zip(columns, row))
            artid = artifact["artid"]

            with connection.cursor() as cursor:
                cursor.execute("SELECT Creators FROM ARTIFACT_CREATORS WHERE ArtID = %s", [artid])
                creators = [row[0] for row in cursor.fetchall()]

                cursor.execute("SELECT Ratings FROM ARTIFACT_RATINGS WHERE ArtID = %s", [artid])
                ratings = [row[0] for row in cursor.fetchall()]

                cursor.execute("""
                    SELECT A.First_Name, A.Middle_Name, A.Last_Name, A.Date_of_Birth
                    FROM ARTIST A
                    JOIN CREATES C ON A.AID = C.AID
                    WHERE C.ArtID = %s
                """, [artid])
                artists = [
                    {
                        "first_name": a[0],
                        "middle_name": a[1],
                        "last_name": a[2],
                        "date_of_birth": a[3]
                    }
                    for a in cursor.fetchall()
                ]

            artifact["creators"] = creators
            artifact["ratings"] = ratings
            artifact["artists"] = artists
            artifacts.append(artifact)

        return Response({"artifacts": artifacts}, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"message": str(e)}, status=500)


# function for adding an artifact
@api_view(["POST"])
def add_artifact(request):
    data = request.data

    required_fields = ["name", "description", "year_made", "display_status", "exid", "semail"]
    for field in required_fields:
        if not data.get(field):
            return Response({"message": f"Missing required field: {field}"}, status=400)

    try:
        with connection.cursor() as cursor:
            # Auto-generate a unique ArtID
            cursor.execute("SELECT MAX(ArtID) FROM ARTIFACT")
            max_id = cursor.fetchone()[0]
            new_artid = (max_id or 0) + 1

            # Insert the new artifact
            cursor.execute("""
                INSERT INTO ARTIFACT (ArtID, Name, Description, Year_Made, Display_Status, ExID, SEmail)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, [
                new_artid,
                data["name"],
                data["description"],
                data["year_made"],
                data["display_status"],
                data["exid"],
                data["semail"]
            ])

        return Response({"message": "Artifact added successfully."}, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"message": f"Error: {str(e)}"}, status=500)


@api_view(["POST"])
def update_artifact(request):
    data = request.data
    required_fields = ["artid", "name", "description", "year_made", "display_status", "exid"]

    for field in required_fields:
        if not data.get(field):
            return Response({"message": f"Missing field: {field}"}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE ARTIFACT SET
                Name = %s,
                Description = %s,
                Year_Made = %s,
                Display_Status = %s,
                ExID = %s
                WHERE ArtID = %s
            """, [
                data["name"],
                data["description"],
                data["year_made"],
                data["display_status"],
                data["exid"],
                data["artid"]
            ])

        return Response({"message": "Artifact updated successfully."})
    except Exception as e:
        return Response({"message": f"Update failed: {str(e)}"}, status=500)

@api_view(["POST"])
def delete_artifact(request):
    artid = request.data.get("artid")

    if not artid:
        return Response({"message": "Artifact ID is required."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM ARTIFACT WHERE ArtID = %s", [artid])
        return Response({"message": "Artifact deleted successfully."})
    except Exception as e:
        return Response({"message": f"Delete failed: {str(e)}"}, status=500)

@api_view(['POST'])
def add_exhibit(request):
    data = request.data
    name = data.get('name')
    address = data.get('address')

    if not name or not address:
        return Response({"message": "Missing required fields."}, status=400)

    try:
        with connection.cursor() as cursor:
            # Generate a unique ExID
            while True:
                exid = random.randint(100000, 999999)
                cursor.execute("SELECT 1 FROM EXHIBIT WHERE ExID = %s", [exid])
                if not cursor.fetchone():
                    break

            cursor.execute("""
                INSERT INTO EXHIBIT (ExID, Name, Address)
                VALUES (%s, %s, %s)
            """, [exid, name, address])

        return Response({"message": "Exhibit added successfully."}, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"message": f"Error: {str(e)}"}, status=500)

@api_view(['POST'])
def update_exhibit(request):
    data = request.data
    exid = data.get('exid')
    name = data.get('name')

    if not exid:
        return Response({"message": "Exhibit ID is required."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                UPDATE EXHIBIT SET Name = %s WHERE ExID = %s
            """, [name, exid])

        return Response({"message": "Exhibit updated successfully."}, status=200)

    except Exception as e:
        return Response({"message": f"Update failed: {str(e)}"}, status=500)

@api_view(['POST'])
def delete_exhibit(request):
    data = request.data
    exid = data.get('exid')

    if not exid:
        return Response({"message": "Exhibit ID is required."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM EXHIBIT WHERE ExID = %s", [exid])

        return Response({"message": "Exhibit deleted successfully."}, status=200)

    except Exception as e:
        return Response({"message": f"Delete failed: {str(e)}"}, status=500)

@api_view(['GET'])
def get_exhibits(request):
    address = request.GET.get('address')

    if not address:
        return Response({"message": "Museum address is required."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT ExID, Name FROM EXHIBIT WHERE Address = %s", [address])
            exhibits = cursor.fetchall()
            result = [{"exid": row[0], "name": row[1]} for row in exhibits]

        return Response({"exhibits": result}, status=200)
    except Exception as e:
        return Response({"message": f"Server error: {str(e)}"}, status=500)

@api_view(['GET'])
def get_events(request):
    address = request.GET.get('address')
    if not address:
        return Response({"message": "Museum address is required."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT E.EvID, E.Name, E.Start_Date, E.End_Date, X.Name AS Exhibit_Name
                FROM EVENT E
                JOIN PART_OF P ON E.EvID = P.EvID
                JOIN EXHIBIT X ON P.ExID = X.ExID
                WHERE E.Address = %s
            """, [address])
            rows = cursor.fetchall()
            columns = [col[0].lower() for col in cursor.description]
            events = [dict(zip(columns, row)) for row in rows]

        return Response({"events": events}, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"message": f"Failed to get events: {str(e)}"}, status=500)


@api_view(['POST'])
def add_event(request):
    data = request.data
    name = data.get('name')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    exid = data.get('exid')
    address = data.get('address')

    if not all([name, start_date, end_date, exid, address]):
        return Response({"message": "Missing required fields."}, status=400)

    try:
        with connection.cursor() as cursor:
            # Generate unique Event ID
            while True:
                evid = random.randint(100000, 999999)
                cursor.execute("SELECT 1 FROM EVENT WHERE EvID = %s", [evid])
                if not cursor.fetchone():
                    break

            # Insert into EVENT table
            cursor.execute("""
                INSERT INTO EVENT (EvID, Name, Start_Date, End_Date, Address)
                VALUES (%s, %s, %s, %s, %s)
            """, [evid, name, start_date, end_date, address])

            # Insert into PART_OF table
            cursor.execute("""
                INSERT INTO PART_OF (EvID, ExID)
                VALUES (%s, %s)
            """, [evid, exid])

        return Response({"message": "Event added successfully."}, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"message": f"Error: {str(e)}"}, status=500)

@api_view(['POST'])
def update_event(request):
    data = request.data
    evid = data.get('evid')
    name = data.get('name')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    exid = data.get('exid')

    if not evid:
        return Response({"message": "EvID is required."}, status=400)

    try:
        with connection.cursor() as cursor:
            # Only update the fields that are provided (not blank or null)
            if name and name.strip():
                cursor.execute("UPDATE EVENT SET Name = %s WHERE EvID = %s", [name.strip(), evid])

            if start_date and start_date.strip():
                cursor.execute("UPDATE EVENT SET Start_Date = %s WHERE EvID = %s", [start_date.strip(), evid])

            if end_date and end_date.strip():
                cursor.execute("UPDATE EVENT SET End_Date = %s WHERE EvID = %s", [end_date.strip(), evid])

            if exid and str(exid).strip():
                cursor.execute("UPDATE PART_OF SET ExID = %s WHERE EvID = %s", [exid, evid])

        return Response({"message": "Event updated successfully."}, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"message": f"Update failed: {str(e)}"}, status=500)


@api_view(['POST'])
def delete_event(request):
    evid = request.data.get('evid')

    if not evid:
        return Response({"message": "EvID required"}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM EVENT WHERE EvID = %s", [evid])

        return Response({"message": "Event deleted successfully."})
    except Exception as e:
        return Response({"message": f"Delete failed: {str(e)}"}, status=500)

@api_view(["GET"])
def get_artists(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM ARTIST")
            artist_rows = cursor.fetchall()
            artists = []

            for artist in artist_rows:
                aid, dob, first, middle, last = artist

                # Fetch artifact names and IDs
                cursor.execute("""
                    SELECT A.ArtID, A.Name
                    FROM CREATES C
                    JOIN ARTIFACT A ON C.ArtID = A.ArtID
                    WHERE C.AID = %s
                """, [aid])
                artifact_rows = cursor.fetchall()
                artifact_names = [row[1] for row in artifact_rows]
                selected_artifacts = [str(row[0]) for row in artifact_rows]  # Match <select> input type

                artists.append({
                    "aid": aid,
                    "date_of_birth": dob,
                    "first_name": first,
                    "middle_name": middle,
                    "last_name": last,
                    "artifacts": artifact_names,
                    "selectedArtifacts": selected_artifacts  # <- Match frontend key
                })

        return Response({"artists": artists}, status=200)
    except Exception as e:
        return Response({"message": f"Error: {str(e)}"}, status=500)


@api_view(["GET"])
def get_artifacts_for_artist(request):
    semail = request.GET.get("semail")

    if not semail:
        return Response({"message": "Missing supervisor email."}, status=400)

    try:
        with connection.cursor() as cursor:
            # Step 1: Get the supervisor's museum address
            cursor.execute("SELECT MuseumAddress FROM SUPERVISOR WHERE SEmail = %s", [semail])
            result = cursor.fetchone()
            if not result:
                return Response({"message": "Supervisor not found."}, status=404)
            museum_address = result[0]

            # Step 2: Get artifacts from exhibits in that museum
            cursor.execute("""
                SELECT A.ArtID, A.Name
                FROM ARTIFACT A
                JOIN EXHIBIT E ON A.ExID = E.ExID
                WHERE E.Address = %s
            """, [museum_address])
            rows = cursor.fetchall()
            artifacts = [{"artid": row[0], "name": row[1]} for row in rows]

        return Response({"artifacts": artifacts}, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"message": str(e)}, status=500)

@api_view(['POST'])
def add_artist(request):
    data = request.data
    dob = data.get("date_of_birth")
    first = data.get("first_name")
    middle = data.get("middle_name", "")
    last = data.get("last_name")
    artifacts = data.get("artifact_ids", [])

    if not all([dob, first, last]):
        return Response({"message": "Missing required fields."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT MAX(AID) FROM ARTIST")
            max_id = cursor.fetchone()[0]
            new_aid = (max_id or 0) + 1

            cursor.execute("""
                INSERT INTO ARTIST (AID, Date_of_Birth, First_Name, Middle_Name, Last_Name)
                VALUES (%s, %s, %s, %s, %s)
            """, [new_aid, dob, first, middle, last])

            for artid in artifacts:
                cursor.execute("""
                    INSERT INTO CREATES (ArtID, AID) VALUES (%s, %s)
                """, [artid, new_aid])

        return Response({"message": "Artist added successfully."})
    except Exception as e:
        return Response({"message": f"Failed to add artist: {str(e)}"}, status=500)



@api_view(["POST"])
def update_artist(request):
    data = request.data
    aid = data.get("aid")

    if not aid:
        return Response({"message": "Artist ID is required."}, status=400)

    try:
        with connection.cursor() as cursor:
            # Update artist info
            cursor.execute("""
                UPDATE ARTIST
                SET Date_of_Birth = %s,
                    First_Name = %s,
                    Middle_Name = %s,
                    Last_Name = %s
                WHERE AID = %s
            """, [
                data.get("date_of_birth", ""),
                data.get("first_name", ""),
                data.get("middle_name", ""),
                data.get("last_name", ""),
                aid
            ])

            # Replace assigned artifacts
            cursor.execute("DELETE FROM CREATES WHERE AID = %s", [aid])
            for artid in data.get("selectedArtifacts", []):
                cursor.execute("INSERT INTO CREATES (ArtID, AID) VALUES (%s, %s)", [artid, aid])

        return Response({"message": "Artist updated successfully."}, status=200)

    except Exception as e:
        return Response({"message": f"Update failed: {str(e)}"}, status=500)

@api_view(["POST"])
def delete_artist(request):
    aid = request.data.get("aid")

    if not aid:
        return Response({"message": "Artist ID is required."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM ARTIST WHERE AID = %s", [aid])

        return Response({"message": "Artist deleted successfully."}, status=200)

    except Exception as e:
        return Response({"message": f"Delete failed: {str(e)}"}, status=500)

@api_view(["POST"])
def record_edit_artifact(request):
    eemail = request.data.get("eemail")
    artid = request.data.get("artid")

    if not eemail or not artid:
        return Response({"message": "Missing EEmail or ArtID."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO EDITS_ARTIFACTS (EEmail, ArtID)
                VALUES (%s, %s)
            """, [eemail, artid])

        return Response({"message": "Artifact edit recorded successfully."})
    except Exception as e:
        return Response({"message": str(e)}, status=500)


@api_view(["POST"])
def record_edit_event(request):
    eemail = request.data.get("eemail")
    evid = request.data.get("evid")

    if not eemail or not evid:
        return Response({"message": "Missing EEmail or EvID."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO EDITS_EVENTS (EEmail, EvID)
                VALUES (%s, %s)
            """, [eemail, evid])
        return Response({"message": "Event edit recorded successfully."})
    except Exception as e:
        return Response({"message": str(e)}, status=500)


@api_view(["POST"])
def record_edit_exhibit(request):
    eemail = request.data.get("eemail")
    exid = request.data.get("exid")

    if not eemail or not exid:
        return Response({"message": "Missing EEmail or ExID."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO EDITS_EXHIBITS (EEmail, ExID)
                VALUES (%s, %s)
            """, [eemail, exid])
        return Response({"message": "Exhibit edit recorded successfully."})
    except Exception as e:
        return Response({"message": str(e)}, status=500)

@api_view(["GET"])
def get_edit_logs(request):
    semail = request.GET.get("email") 

    if not semail:
        return Response({"message": "Missing supervisor email."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT a.EditID, a.EEmail, a.ArtID AS TargetID, a.EditTime, 'Artifact' AS Type, e.SEmail
                FROM EDITS_ARTIFACTS a
                JOIN EMPLOYEE e ON a.EEmail = e.EEmail
                WHERE e.SEmail = %s
                UNION ALL
                SELECT ev.EditID, ev.EEmail, ev.EvID AS TargetID, ev.EditTime, 'Event' AS Type, e.SEmail
                FROM EDITS_EVENTS ev
                JOIN EMPLOYEE e ON ev.EEmail = e.EEmail
                WHERE e.SEmail = %s
                UNION ALL
                SELECT ex.EditID, ex.EEmail, ex.ExID AS TargetID, ex.EditTime, 'Exhibit' AS Type, e.SEmail
                FROM EDITS_EXHIBITS ex
                JOIN EMPLOYEE e ON ex.EEmail = e.EEmail
                WHERE e.SEmail = %s
                ORDER BY EditTime DESC
            """, [semail, semail, semail])

            rows = cursor.fetchall()

        logs = [
            {
                "edit_id": row[0],
                "eemail": row[1],
                "target_id": row[2],
                "edit_time": row[3],
                "type": row[4],
                "semail": row[5],
            }
            for row in rows
        ]

        return Response({"logs": logs})

    except Exception as e:
        return Response({"message": str(e)}, status=500)

@api_view(["GET"])
def get_all_artifacts(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT ArtID, Name, Description, Year_Made, Display_Status, ExID FROM ARTIFACT")
            rows = cursor.fetchall()

        artifacts = [
            {
                "artid": row[0],
                "name": row[1],
                "description": row[2],
                "year_made": row[3],
                "display_status": row[4],
                "exid": row[5],
            }
            for row in rows
        ]
        return Response({"artifacts": artifacts})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    
@api_view(["GET"])
def get_all_events(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT E.EvID, E.Name, E.Start_Date, E.End_Date, E.Address, X.Name AS ExhibitName, M.Name AS MuseumName
                FROM EVENT E
                JOIN PART_OF P ON E.EvID = P.EvID
                JOIN EXHIBIT X ON P.ExID = X.ExID
                JOIN MUSEUM M ON X.Address = M.Address
            """)
            rows = cursor.fetchall()

        events = [
            {
                "eid": row[0],
                "name": row[1],
                "start_date": row[2],
                "end_date": row[3],
                "location": row[4],
                "exhibit_name": row[5],
                "museum_name": row[6],
            }
            for row in rows
        ]
        return Response({"events": events})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_all_exhibits(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT X.ExID, X.Name, X.Address, M.Name AS MuseumName
                FROM EXHIBIT X
                JOIN MUSEUM M ON X.Address = M.Address
            """)
            rows = cursor.fetchall()

        exhibits = [
            {
                "exid": row[0],
                "name": row[1],
                "description": f"Part of {row[3]} at {row[2]}",  # Constructed description
                "start_date": "N/A",  # Placeholder — you can replace with real dates if you add them
                "end_date": "N/A"
            }
            for row in rows
        ]
        return Response({"exhibits": exhibits})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_all_museums(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT Address, Name FROM MUSEUM")
            rows = cursor.fetchall()

        museums = [
            {
                "address": row[0],
                "name": row[1],
                "phone": "N/A"  # Placeholder, update if you add a phone column
            }
            for row in rows
        ]
        return Response({"museums": museums})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_all_visitors(request):
    try:
        with connection.cursor() as cursor:
            # Get visitor user data
            cursor.execute("""
                SELECT U.Email, U.First_Name, U.Middle_Name, U.Last_Name, U.Username, U.Year_of_Birth
                FROM USER U
                JOIN VISITOR V ON U.Email = V.VEmail
            """)
            visitor_rows = cursor.fetchall()

            # Get museum names for each visitor
            cursor.execute("""
                SELECT VEmail, M.Name
                FROM VISITS V
                JOIN MUSEUM M ON V.Address = M.Address
            """)
            visit_rows = cursor.fetchall()

        # Map visitor email to a list of museum names
        visits_map = {}
        for vemail, museum_name in visit_rows:
            visits_map.setdefault(vemail, []).append(museum_name)

        # Build final response
        visitors = [
            {
                "email": row[0],
                "first_name": row[1],
                "middle_name": row[2],
                "last_name": row[3],
                "username": row[4],
                "year_of_birth": row[5],
                "visited_museum_names": visits_map.get(row[0], [])
            }
            for row in visitor_rows
        ]
        return Response({"visitors": visitors})
    except Exception as e:
        return Response({"error": str(e)}, status=500)

@api_view(["GET"])
def get_visited_museums(request):
    email = request.GET.get("email")
    if not email:
        return Response({"message": "Missing email"}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT Address FROM VISITS WHERE VEmail = %s", [email])
            rows = cursor.fetchall()

        visits = [{"address": row[0]} for row in rows]
        return Response({"visits": visits})
    except Exception as e:
        return Response({"message": str(e)}, status=500)

@api_view(["POST"])
def add_visited_museum(request):
    visitor_email = request.data.get("visitor_email")
    museum_address = request.data.get("museum_address")

    if not visitor_email or not museum_address:
        return Response({"message": "Missing visitor_email or museum_address"}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM VISITS WHERE VEmail = %s AND Address = %s",
                [visitor_email, museum_address]
            )
            if cursor.fetchone():
                return Response({"message": "Museum already visited by this user."}, status=400)

            cursor.execute(
                "INSERT INTO VISITS (VEmail, Address) VALUES (%s, %s)",
                [visitor_email, museum_address]
            )
        return Response({"message": "Museum added to visited list successfully!"})
    except Exception as e:
        return Response({"message": str(e)}, status=500)

@api_view(["POST"])
def delete_visited_museum(request):
    visitor_email = request.data.get("visitor_email")
    museum_address = request.data.get("museum_address")

    if not visitor_email or not museum_address:
        return Response({"message": "Missing visitor_email or museum_address"}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute(
                "DELETE FROM VISITS WHERE VEmail = %s AND Address = %s",
                [visitor_email, museum_address]
            )
        return Response({"message": "Museum removed from visited list successfully."})
    except Exception as e:
        return Response({"message": str(e)}, status=500)

@api_view(["POST"])
def submit_artifact_review(request):
    email = request.data.get("email")
    artid = request.data.get("artid")
    rating = request.data.get("rating")
    review_desc = request.data.get("review_desc")

    if not (email and artid and rating is not None and review_desc is not None):
        return Response({"message": "Missing required fields."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO REVIEW_ARTIFACT (VEmail, ArtID, Review_Desc, Rating)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    Review_Desc = VALUES(Review_Desc),
                    Rating = VALUES(Rating)
            """, [email, artid, review_desc, rating])
        return Response({"message": "Review saved successfully."})
    except Exception as e:
        print("❌ Error submitting artifact review:", e)  # Log to console
        return Response({"message": str(e)}, status=500)

@api_view(["POST"])
def delete_artifact_review(request):
    email = request.data.get("email")
    artid = request.data.get("artid")

    if not (email and artid):
        return Response({"message": "Missing email or artid."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("DELETE FROM REVIEW_ARTIFACT WHERE VEmail = %s AND ArtID = %s", [email, artid])
        return Response({"message": "Review deleted successfully."})
    except Exception as e:
        return Response({"message": str(e)}, status=500)

@api_view(["GET"])
def get_artifact_reviews(request):
    artid = request.GET.get("artid")
    if not artid:
        return Response({"message": "Missing artifact ID"}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT RA.VEmail, U.Username, RA.Rating, RA.Review_Desc
                FROM REVIEW_ARTIFACT RA
                JOIN USER U ON RA.VEmail = U.Email
                WHERE RA.ArtID = %s
            """, [artid])
            rows = cursor.fetchall()

        reviews = [
            {
                "email": row[0],
                "username": row[1],
                "rating": row[2],
                "review_desc": row[3]
            }
            for row in rows
        ]
        return Response({"reviews": reviews})
    except Exception as e:
        print("❌ ERROR:", e)
        traceback.print_exc() 
        return Response({"message": str(e)}, status=500)

@api_view(["POST"])
def submit_event_review(request):
    email = request.data.get("email")
    evid = request.data.get("evid")
    rating = request.data.get("rating")
    review_desc = request.data.get("review_desc")

    with connection.cursor() as cursor:
        cursor.execute("""
            INSERT INTO REVIEW_EVENT (VEmail, EvID, Review_Desc, Rating)
            VALUES (%s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE Review_Desc=%s, Rating=%s
        """, [email, evid, review_desc, rating, review_desc, rating])
    return Response({"message": "Review submitted!"})

@api_view(["GET"])
def get_event_reviews(request):
    evid = request.GET.get("evid")
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT R.VEmail, U.Username, R.Review_Desc, R.Rating
            FROM REVIEW_EVENT R
            JOIN VISITOR V ON R.VEmail = V.VEmail
            JOIN USER U ON V.VEmail = U.Email
            WHERE R.EvID = %s
        """, [evid])
        rows = cursor.fetchall()
        reviews = [{
            "email": row[0],
            "username": row[1],
            "review_desc": row[2],
            "rating": row[3],
        } for row in rows]
    return Response({"reviews": reviews})

@api_view(["GET"])
def get_visitor_artifact_reviews(request):
    email = request.GET.get("email")
    if not email:
        return Response({"message": "Missing email"}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    RA.ArtID,
                    A.Name,
                    RA.Review_Desc,
                    RA.Rating
                FROM REVIEW_ARTIFACT RA
                JOIN ARTIFACT A ON RA.ArtID = A.ArtID
                WHERE RA.VEmail = %s
            """, [email])
            rows = cursor.fetchall()

        reviews = [
            {
                "review_id": f"{email}_{row[0]}",
                "artifact_name": row[1],
                "review_text": row[2],
                "rating": row[3]
            }
            for row in rows
        ]

        return Response({"reviews": reviews})
    except Exception as e:
        return Response({"message": str(e)}, status=500)

@api_view(["GET"])
def get_visitor_event_reviews(request):
    email = request.GET.get("email")
    if not email:
        return Response({"message": "Missing email"}, status=400)

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT E.Name, R.Rating, R.Review_Desc
            FROM REVIEW_EVENT R
            JOIN EVENT E ON R.EvID = E.EvID
            WHERE R.VEmail = %s
        """, [email])
        reviews = cursor.fetchall()

    review_data = [
        {
            "event_name": row[0],
            "rating": row[1],
            "review_text": row[2],
        }
        for row in reviews
    ]

    return Response({"reviews": review_data})

@api_view(["POST"])
def delete_event_review(request):
    email = request.data.get("email")
    evid = request.data.get("evid")

    if not email or not evid:
        return Response({"message": "Missing email or event ID."}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                DELETE FROM REVIEW_EVENT
                WHERE VEmail = %s AND EvID = %s
            """, [email, evid])
        return Response({"message": "Review deleted successfully."})
    except Exception as e:
        print("Error deleting event review:", e)
        return Response({"message": "Failed to delete review."}, status=500)


