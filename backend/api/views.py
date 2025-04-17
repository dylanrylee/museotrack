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

# Register account for supervisor
def register_supervisor(s_email, first_name, middle_name, last_name, username, password, year_of_birth):
    hashed_password = make_password(password)
    
    queries = [
        ("INSERT INTO USER VALUES (%s, %s, %s, %s, %s, %s, %s)", 
         [s_email, first_name, middle_name, last_name, username, hashed_password, year_of_birth]),
        ("INSERT INTO SUPERVISOR VALUES (%s, NULL)", 
         [s_email])
    ]
    
    return execute_transaction(queries)

# Register account for employee
def register_employee(e_email, first_name, middle_name, last_name, username, password, year_of_birth, s_email):
    hashed_password = make_password(password)
    
    queries = [
        ("INSERT INTO USER VALUES (%s, %s, %s, %s, %s, %s, %s)", 
         [e_email, first_name, middle_name, last_name, username, hashed_password, year_of_birth]),
        ("INSERT INTO EMPLOYEE VALUES (%s, %s, NULL)", 
         [e_email, s_email])
    ]
    
    return execute_transaction(queries)

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

# Select museum functions
def select_museum(address):
    """Get museum details"""
    query = """
    SELECT Name, Address
    FROM MUSEUM
    WHERE Address = %s
    """
    return execute_query(query, [address])

# Browse artifacts
def browse_artifacts(name):
    """Search artifacts by name"""
    query = """
    SELECT ArtID, Name, Description, Year_Made, ExID
    FROM ARTIFACT
    WHERE Name = %s
    """
    return execute_query(query, [name])

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

# Add artifact
def add_artifact(art_id, name, description, year_made, s_email, ex_id):
    query = """
    INSERT INTO ARTIFACT
    VALUES (%s, %s, %s, %s, %s, %s, 'On Display')
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [art_id, name, description, year_made, s_email, ex_id])
        return cursor.rowcount > 0

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
def add_exhibit(ex_id, name, address):
    query = """
    INSERT INTO EXHIBIT
    VALUES (%s, %s, %s)
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [ex_id, name, address])
        return cursor.rowcount > 0

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

# delete employee
def delete_employee(e_email):
    query = """
    DELETE FROM EMPLOYEE  
    WHERE EEmail = %s
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [e_email])
        return cursor.rowcount > 0

# edit employee username
def edit_employee_username(e_email, new_username):
    query = """
    UPDATE USER
    SET Username = %s
    WHERE Email = %s
        AND Email IN (
            SELECT EEmail
            FROM EMPLOYEE
        )
    """
    with connection.cursor() as cursor:
        cursor.execute(query, [new_username, e_email])
        return cursor.rowcount > 0