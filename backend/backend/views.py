from django.http import JsonResponse

def sample_api(request):
    return JsonResponse({"message": "Hello from Django API!"})
