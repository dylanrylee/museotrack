from django.db import connection
from django.contrib.auth.hashers import make_password, check_password
import datetime
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .token_serializers import CustomTokenObtainPairSerializer

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
def get_artifacts(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM ARTIFACT")
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
        return Response({"message": str(e)}, status=500)

# function for adding an artifact
@api_view(["POST"])
def add_artifact(request):
    data = request.data

    required_fields = ["artid", "name", "description", "year_made", "display_status", "exid", "semail"]
    for field in required_fields:
        if not data.get(field):
            return Response({"message": f"Missing required field: {field}"}, status=400)

    try:
        with connection.cursor() as cursor:
            # Check for duplicate ArtID
            cursor.execute("SELECT 1 FROM ARTIFACT WHERE ArtID = %s", [data["artid"]])
            if cursor.fetchone():
                return Response({"message": "ArtID already exists."}, status=400)

            # Insert new artifact
            cursor.execute("""
                INSERT INTO ARTIFACT (ArtID, Name, Description, Year_Made, Display_Status, ExID, SEmail)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, [
                data["artid"],
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
    required_fields = ['exid', 'name', 'address']

    for field in required_fields:
        value = data.get(field)
        if not value or str(value).strip() == "":
            return Response({"message": f"Missing required field: {field}"}, status=400)

    exid = data['exid']
    name = data['name']
    address = data['address']

    try:
        with connection.cursor() as cursor:
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
        return Response({"message": "Museum address required"}, status=400)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT E.EvID, E.Name, E.Start_Date, E.End_Date, X.Name
                FROM EVENT E
                JOIN PART_OF P ON E.EvID = P.EvID
                JOIN EXHIBIT X ON P.ExID = X.ExID
                WHERE E.Address = %s
            """, [address])
            rows = cursor.fetchall()

        events = [{
            "evid": r[0],
            "name": r[1],
            "start_date": r[2],
            "end_date": r[3],
            "exhibit_name": r[4]
        } for r in rows]

        return Response({"events": events})
    except Exception as e:
        return Response({"message": str(e)}, status=500)

@api_view(['POST'])
def add_event(request):
    data = request.data
    evid = data.get('evid')
    name = data.get('name')
    start_date = data.get('start_date')
    end_date = data.get('end_date')
    exid = data.get('exid')
    address = data.get('address')

    if not all([evid, name, start_date, end_date, exid, address]):
        return Response({"message": "Missing required fields."}, status=400)

    try:
        with connection.cursor() as cursor:
            # Check if the exhibit exists
            cursor.execute("SELECT 1 FROM EXHIBIT WHERE ExID = %s", [exid])
            if not cursor.fetchone():
                return Response({"message": "Exhibit not found."}, status=404)

            # Insert into EVENT
            cursor.execute("""
                INSERT INTO EVENT (EvID, Name, Start_Date, End_Date, Address)
                VALUES (%s, %s, %s, %s, %s)
            """, [evid, name, start_date, end_date, address])

            # Insert into PART_OF
            cursor.execute("""
                INSERT INTO PART_OF (EvID, ExID)
                VALUES (%s, %s)
            """, [evid, exid])

        return Response({"message": "Event added successfully."}, status=200)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"message": f"Add event failed: {str(e)}"}, status=500)

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
            if name:
                cursor.execute("UPDATE EVENT SET Name = %s WHERE EvID = %s", [name, evid])
            if start_date:
                cursor.execute("UPDATE EVENT SET Start_Date = %s WHERE EvID = %s", [start_date, evid])
            if end_date:
                cursor.execute("UPDATE EVENT SET End_Date = %s WHERE EvID = %s", [end_date, evid])
            if exid:
                cursor.execute("UPDATE PART_OF SET ExID = %s WHERE EvID = %s", [exid, evid])

        return Response({"message": "Event updated successfully."})
    except Exception as e:
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







# Browse visitor
def browse_visitor(v_email):
    query = """
    SELECT V.VEmail, U.First_Name, U.Middle_Name, U.Last_Name, U.Username, U.Year_of_Birth
    FROM VISITOR AS V
         JOIN USER AS U ON U.Email = V.VEmail
    WHERE V.VEmail = %s
    """
    return execute_query(query, [v_email])

# Select self profile
def select_self_profile(email):
    query = """
    SELECT Email, First_Name, Middle_Name, Last_Name, Username, Year_of_Birth
    FROM USER
    WHERE Email = %s
    """
    return execute_query(query, [email])

# Edit profile username
def edit_profile_username(email, username):
    query = """
    UPDATE USER
    SET Username = %s
    WHERE Email = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [username, email])
        return cursor.rowcount > 0

# Delete account
def delete_account(email, fname, mname, lname, username):
    query = """
    DELETE FROM USER
    WHERE Email = %s
        AND First_Name = %s
        AND Middle_Name = %s
        AND Last_Name = %s
        AND Username = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [email, fname, mname, lname, username])
        return cursor.rowcount > 0
    
# Add visited museum
def add_visited_museum(v_email, address):
    query = """
    INSERT INTO VISITS VALUES (%s, %s)
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [v_email, address])
        return cursor.rowcount > 0
    




# Select museum functions
def select_museum(address):
    """Get museum details"""
    query = """
    SELECT Name, Address
    FROM MUSEUM
    WHERE Address = %s
    """
    return execute_query(query, [address])

# Select artifact
def select_artifact(art_id):
    query = """
    SELECT A.ArtID, A.Name, A.Description, A.Year_Made,
           M.Name AS Museum_Name, E.Name AS Exhibit_Name, 
           U.First_Name, U.Last_Name
    FROM ARTIFACT AS A
    JOIN EXHIBIT AS E ON A.ExID = E.ExID
    JOIN MUSEUM AS M ON E.Address = M.Address
    JOIN SUPERVISOR AS S ON A.SEmail = S.SEmail
    JOIN USER AS U ON S.SEmail = U.Email
    WHERE A.ArtID = %s
    """
    return execute_query(query, [art_id])

# Review artifact
def review_artifact(v_email, art_id, review_desc):
    query = """
    INSERT INTO REVIEW_ARTIFACT
    VALUES(%s, %s, %s)
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [v_email, art_id, review_desc])
        return cursor.rowcount > 0

# browse artists
def browse_artists(first_name, last_name):
    query = """
    SELECT A.AID, A.Date_of_Birth, A.Date_of_Death, 
           A.First_Name, A.Middle_Name, A.Last_Name,
           ART.ArtID, ART.ArtName
    FROM ARTIST AS A
        JOIN ARTIST_WORKS AS ART ON ART.AID = A.AID
    WHERE A.First_Name = %s
        AND A.Last_Name = %s
    """
    return execute_query(query, [first_name, last_name])

# select artist
def select_artist(aid):
    query = """
    SELECT AID, First_Name, Middle_Name, Last_Name, Date_of_Birth  
    FROM ARTIST  
    WHERE AID = %s
    """
    return execute_query(query, [aid])

# browse events
def browse_events(name):
    query = """
    SELECT EV.EvID, EV.Name, EV.Start_Date, EV.End_Date, EV.Address, EX.Name as Exhibit_Name
    FROM EVENT AS EV
        JOIN PART_OF AS PO ON PO.EvID = EV.EvID
        JOIN EXHIBIT AS EX ON EX.ExID = PO.ExID
    WHERE EV.Name = %s
    """
    return execute_query(query, [name])

# select event
def select_event(ev_id):
    query = """
    SELECT EvID, Name, Start_Date, End_Date, Address  
    FROM EVENT  
    WHERE EvID = %s
    """
    return execute_query(query, [ev_id])

# Review event
def review_event(v_email, ev_id, review_desc):
    query = """
    INSERT INTO REVIEW_EVENT
    VALUES (%s, %s, %s)
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [v_email, ev_id, review_desc])
        return cursor.rowcount > 0

# Browse exhibits
def browse_exhibits(name):
    query = """
    SELECT EX.ExID, EX.Name, EX.Address, ART.Name as Artifact_Name
    FROM EXHIBIT AS EX
        JOIN ARTIFACT AS ART ON ART.ExID = EX.ExID
    WHERE EX.Name = %s
    """
    return execute_query(query, [name])

# Select exhibit
def select_exhibit(ex_id):
    query = """
    SELECT ExID, Name, Address  
    FROM EXHIBIT
    WHERE ExID = %s
    """
    return execute_query(query, [ex_id])

# Browse museums
def browse_museums(name):
    query = """
    SELECT M.Name, M.Address, EX.Name as Exhibit_Name
    FROM MUSEUM AS M
        JOIN EXHIBIT AS EX ON EX.Address = M.Address
    WHERE M.Name = %s
    """
    return execute_query(query, [name])

# Manage artifacts
def manage_artifacts(s_email):
    query = """
    SELECT A.ArtID, A.Name AS Artifact_Name, A.Description, A.Year_Made, E.Name AS Exhibit_Name
    FROM ARTIFACT AS A
    JOIN EXHIBIT AS E ON A.ExID = E.ExID
    JOIN SUPERVISOR AS S ON A.SEmail = S.SEmail
    WHERE S.SEmail = %s
    """
    return execute_query(query, [s_email])

# Select artifact
def select_artifact(art_id):
    query = """
    SELECT A.ArtID, A.Name, A.Description, A.Year_Made,
           M.Name AS Museum_Name, E.Name AS Exhibit_Name, 
           U.First_Name, U.Last_Name
    FROM ARTIFACT AS A
    JOIN EXHIBIT AS E ON A.ExID = E.ExID
    JOIN MUSEUM AS M ON E.Address = M.Address
    JOIN SUPERVISOR AS S ON A.SEmail = S.SEmail
    JOIN USER AS U ON S.SEmail = U.Email
    WHERE A.ArtID = %s
    """
    return execute_query(query, [art_id])

# Edit artifact name
def edit_artifact_name(art_id, name):
    query = """
    UPDATE ARTIFACT
    SET Name = %s
    WHERE ArtID = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [name, art_id])
        return cursor.rowcount > 0

# Edit artifact display status
def edit_artifact_display_status(art_id, display_status):
    query = """
    UPDATE ARTIFACT
    SET Display_Status = %s
    WHERE ArtID = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [display_status, art_id])
        return cursor.rowcount > 0

# Edit Artifact year made
def edit_artifact_year_made(art_id, year_made):
    query = """
    UPDATE ARTIFACT
    SET Year_Made = %s
    WHERE ArtID = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [year_made, art_id])
        return cursor.rowcount > 0

# Edit Artifact creators
def edit_artifact_creators(art_id, creators):
    query = """
    UPDATE ARTIFACT
    SET Creators = %s
    WHERE ArtID = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [creators, art_id])
        return cursor.rowcount > 0

# Edit artifact description
def edit_artifact_description(art_id, description):
    query = """
    UPDATE ARTIFACT
    SET Description = %s
    WHERE ArtID = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [description, art_id])
        return cursor.rowcount > 0

# Remove artifact
def remove_artifact(art_id, name, ex_id):
    query = """
    DELETE FROM ARTIFACT
    WHERE ArtID = %s  
        AND Name = %s
        AND ExID = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [art_id, name, ex_id])
        return cursor.rowcount > 0

# Manage exhibits
def manage_exhibits(s_email):
    """Get exhibits managed by a supervisor"""
    query = """
    SELECT E.ExID, E.Name, E.Address
    FROM EXHIBIT AS E
    JOIN MUSEUM AS M ON E.Address = M.Address
    JOIN SUPERVISOR AS S ON M.Address = S.MuseumAddress
    WHERE S.SEmail = %s
    """
    return execute_query(query, [s_email])

# Add exhibit


# Remove exhibit
def remove_exhibit(ex_id, name, address):
    query = """
    DELETE FROM EXHIBIT
    WHERE ExID = %s
        AND Name = %s
        AND Address = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [ex_id, name, address])
        return cursor.rowcount > 0

# Select exhibit
def select_exhibit(ex_id):
    query = """
    SELECT ExID, Name, Address  
    FROM EXHIBIT
    WHERE ExID = %s
    """
    return execute_query(query, [ex_id])

# Edit exhibit name
def edit_exhibit_name(ex_id, name):
    query = """
    UPDATE EXHIBIT
    SET Name = %s
    WHERE ExID = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [name, ex_id])
        return cursor.rowcount > 0

# Manage events
def manage_events(s_email):
    query = """
    SELECT E.EvID, E.Name, E.Start_Date, E.End_Date, E.Address  
    FROM EVENT E  
    JOIN PART_OF P ON E.EvID = P.EvID  
    JOIN EXHIBIT EX ON P.ExID = EX.ExID  
    JOIN MUSEUM M ON EX.Address = M.Address  
    JOIN SUPERVISOR S ON M.Address = S.MuseumAddress  
    WHERE S.SEmail = %s
    """
    return execute_query(query, [s_email])

# Schedule event
def schedule_event(ev_id, name, start_date, end_date, address):
    """Schedule a new event"""
    # check the start and end dates
    try:
        start = datetime.datetime.strptime(start_date, '%Y-%m-%d')
        end = datetime.datetime.strptime(end_date, '%Y-%m-%d')
        if end < start:
            return False
    except ValueError:
        return False

    query = """
    INSERT INTO EVENT
    VALUES (%s, %s, %s, %s, %s)
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [ev_id, name, start_date, end_date, address])
        return cursor.rowcount > 0

# select event
def select_event(ev_id):
    query = """
    SELECT EvID, Name, Start_Date, End_Date, Address  
    FROM EVENT  
    WHERE EvID = %s
    """
    return execute_query(query, [ev_id])

# Edit event name
def edit_event_name(ev_id, name):
    query = """
    UPDATE EVENT  
    SET Name = %s
    WHERE EvID = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [name, ev_id])
        return cursor.rowcount > 0

# edit event start date
def edit_event_start_date(ev_id, start_date):
    # check for the date format first
    try:
        datetime.datetime.strptime(start_date, '%Y-%m-%d')
    except ValueError:
        query = """
        UPDATE EVENT  
        SET Start_Date = %s
        WHERE EvID = %s
        """
        with connection.cursor() as cursor:
            cursor.execute(query, [start_date, ev_id])
            return cursor.rowcount > 0

# edit event end date
def edit_event_end_date(ev_id, end_date):
    # check for the date format first
    try:
        datetime.datetime.strptime(end_date, '%Y-%m-%d')
    except ValueError:
        return False

    query = """
    UPDATE EVENT  
    SET End_Date = %s
    WHERE EvID = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [end_date, ev_id])
        return cursor.rowcount > 0

# manage exhibits for event
def manage_exhibits_for_event(s_email):
    query = """
    SELECT E.ExID, E.Name, E.Address  
    FROM EXHIBIT AS E  
    JOIN PART_OF AS P ON E.ExID = P.ExID  
    JOIN EVENT AS EV ON P.EvID = EV.EvID  
    JOIN SUPERVISOR AS S ON EV.Address = S.MuseumAddress  
    WHERE S.SEmail = %s
    """
    return execute_query(query, [s_email])

# add exhibit for event
def add_exhibit_for_event(ev_id, ex_id):
    query = """
    INSERT INTO PART_OF
    VALUES (%s, %s)
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [ev_id, ex_id])
        return cursor.rowcount > 0

# remove exhibit from event
def remove_exhibit_from_event(ev_id, ex_id):
    query = """
    DELETE FROM PART_OF
    WHERE EvID = %s
        AND ExID = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [ev_id, ex_id])
        return cursor.rowcount > 0

# manage employees 
def manage_employees(s_email):
    query = """
    SELECT E.EEmail, U.First_Name, U.Middle_Name, U.Last_Name, E.MuseumAddress  
    FROM EMPLOYEE AS E  
         JOIN USER AS U ON E.EEmail = U.Email  
         JOIN SUPERVISOR AS S ON E.MuseumAddress = S.MuseumAddress  
    WHERE S.SEmail = %s
    """
    return execute_query(query, [s_email])

# select employee
def select_employee(e_email):
    query = """
    SELECT E.EEmail, U.First_Name, U.Middle_Name, U.Last_Name, E.MuseumAddress  
    FROM EMPLOYEE AS E  
         JOIN USER AS U ON E.EEmail = U.Email  
         JOIN SUPERVISOR AS S ON E.MuseumAddress = S.MuseumAddress  
    WHERE E.EEmail = %s
    """
    return execute_query(query, [e_email])

# manage reviews for artifact
def manage_reviews_for_artifact(s_email):
    query = """
    SELECT R.VEmail, U.First_Name, U.Middle_Name, U.Last_Name,
           R.ArtID, A.Name AS Artifact_Name, R.Review_Desc  
    FROM REVIEW_ARTIFACT AS R  
    JOIN ARTIFACT AS A ON R.ArtID = A.ArtID  
    JOIN EXHIBIT AS E ON A.ExID = E.ExID  
    JOIN MUSEUM AS M ON E.Address = M.Address  
    JOIN SUPERVISOR AS S ON M.Address = S.MuseumAddress  
    JOIN USER AS U ON R.VEmail = U.Email  
    WHERE S.SEmail = %s
    """
    return execute_query(query, [s_email])

# select review for artifact
def select_review_for_artifact(art_id):
    query = """
    SELECT R.VEmail, U.First_Name, U.Middle_Name, U.Last_Name,
           R.ArtID, A.Name AS Artifact_Name, R.Review_Desc  
    FROM REVIEW_ARTIFACT AS R  
    JOIN ARTIFACT AS A ON R.ArtID = A.ArtID  
    JOIN USER AS U ON R.VEmail = U.Email  
    WHERE A.ArtID = %s
    """
    return execute_query(query, [art_id])

# remove review
def remove_review(v_email, art_id):
    query = """
    DELETE FROM REVIEW_ARTIFACT  
    WHERE VEmail = %s AND ArtID = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [v_email, art_id])
        return cursor.rowcount > 0
