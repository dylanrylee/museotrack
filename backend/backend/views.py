from django.db import connection
from django.contrib.auth.hashers import make_password, check_password
import datetime

# helper function to execute SQL queries 
# with protection against SQL injection
def execute_query(query, params=None):
    with connection.cursor() as cursor:
        cursor.execute(query, params)
        if query.strip().upper().startswith('SELECT'):
            columns = [col[0] for col in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
        return None
    
# helper function to execute transaction with multiple queries
def execute_transaction(queries_with_params):
    with connection.cursor() as cursor:
        try:
            cursor.execute("BEGIN")
            for query, params in queries_with_params:
                cursor.execute(query, params)
            cursor.execute("COMMIT")
            return True
        except Exception as e:
            cursor.execute("ROLLBACK")
            print(f"Transaction failed: {e}")
            return False

# Register account for visitor
def register_account_for_visitor(v_email, first_name, middle_name, last_name, username, password, year_of_birth):
    """Register a new visitor account with hashed password"""
    hashed_password = make_password(password)
    
    queries = [
        ("INSERT INTO USER VALUES (%s, %s, %s, %s, %s, %s, %s)", 
         [v_email, first_name, middle_name, last_name, username, hashed_password, year_of_birth]),
        ("INSERT INTO VISITOR (VEmail) VALUES (%s)", 
         [v_email])
    ]
    
    return execute_transaction(queries)

# Register account for supervisor
def register_account_for_supervisor(s_email, first_name, middle_name, last_name, username, password, year_of_birth):
    """Register a new supervisor account with hashed password"""
    hashed_password = make_password(password)
    
    queries = [
        ("INSERT INTO USER VALUES (%s, %s, %s, %s, %s, %s, %s)", 
         [s_email, first_name, middle_name, last_name, username, hashed_password, year_of_birth]),
        ("INSERT INTO SUPERVISOR VALUES (%s, NULL)", 
         [s_email])
    ]
    
    return execute_transaction(queries)

# Register account for employee
def register_account_for_employee(e_email, first_name, middle_name, last_name, username, password, year_of_birth, s_email):
    """Register a new employee account with hashed password"""
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
    """Get visitor profile information"""
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