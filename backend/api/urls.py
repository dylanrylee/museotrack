from django.contrib import admin
from django.urls import path
from .views import *

urlpatterns = [
    path('login-visitor/', login_visitor),
    path('register-visitor/', register_visitor),
    path('browse-visited-museums/', browse_visited_museums),
    path('login-supervisor-employee/', login_supervisor_employee),
    path('register-supervisor/', register_supervisor),
    path('get-supervisor-employees/', get_supervisor_employees),
    path('get-supervisor-info/', get_supervisor_info),
    path('register-employee/', register_employee),
    path('update-employee/', update_employee),
    path('delete-employee/', delete_employee),
    path("get-artifacts/", get_artifacts),
    path("add-artifact/", add_artifact),
    path("update-artifact/", update_artifact),
    path("delete-artifact/", delete_artifact),
    path("add-exhibit/", add_exhibit),
    path("update-exhibit/", update_exhibit),
    path("delete-exhibit/", delete_exhibit),
    path("get-exhibits/", get_exhibits),
    path("get-events/", get_events),
    path("add-event/", add_event),
    path("update-event/", update_event),
    path("delete-event/", delete_event),

    
    # JWT auth endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenObtainPairView.as_view(), name='token_refresh'),
]
