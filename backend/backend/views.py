from django.http import JsonResponse
from django.db import connection
import hashlib

# Example of a simple API function
def sample_api(request):
    return JsonResponse({"message": "Hello from Django API!"})

# Register Supervisor function
def register_supervisor(request):
    if request.method == "POST":
        # Assuming you are sending data as JSON, you can use request.body to fetch it
        import json
        data = json.loads(request.body)  # Parses JSON data sent in the body
        
        # Extract the values from the request data
        email = data.get("email")
        first_name = data.get("first_name")
        middle_name = data.get("middle_name", None)
        last_name = data.get("last_name")
        username = data.get("username")
        password = data.get("password")
        year_of_birth = data.get("year_of_birth")

        # Hash the password for security purposes
        hashed_password = hashlib.sha256(password.encode()).hexdigest()

        try:
            with connection.cursor() as cursor:
                cursor.execute(
                """
                    INSERT INTO USER (email, first_name, middle_name, last_name, username, password, year_of_birth)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, [email, first_name, middle_name, last_name, username, hashed_password, year_of_birth])

            return JsonResponse({"message": "Supervisor registered successfully"}, status=201)
        
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=400)