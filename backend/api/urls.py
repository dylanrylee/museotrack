from django.contrib import admin
from django.urls import path
from .views import *

urlpatterns = [
    path('login-visitor/', login_visitor),  # Visitor login
    path('register-visitor/', register_visitor),  # Visitor registration
    path('browse-visited-museums/', browse_visited_museums),  # View museums visited by the visitor

    path('login-supervisor-employee/', login_supervisor_employee),  # Login for supervisors and employees
    path('register-supervisor/', register_supervisor),  # Register a new supervisor
    path('get-supervisor-employees/', get_supervisor_employees),  # Get all employees under a supervisor
    path('get-supervisor-info/', get_supervisor_info),  # Get info about the logged-in supervisor
    path('register-employee/', register_employee),  # Register a new employee
    path('update-employee/', update_employee),  # Update employee details
    path('delete-employee/', delete_employee),  # Delete an employee

    path("get-artifacts/", get_artifacts),  # Get artifacts for current supervisor's museum
    path("add-artifact/", add_artifact),  # Add new artifact
    path("update-artifact/", update_artifact),  # Update artifact data
    path("delete-artifact/", delete_artifact),  # Delete artifact

    path("add-exhibit/", add_exhibit),  # Add new exhibit
    path("update-exhibit/", update_exhibit),  # Update exhibit info
    path("delete-exhibit/", delete_exhibit),  # Delete an exhibit
    path("get-exhibits/", get_exhibits),  # Get exhibits for current supervisor's museum

    path("get-events/", get_events),  # Get all events for supervisor's museum
    path("add-event/", add_event),  # Add new event
    path("update-event/", update_event),  # Update event details
    path("delete-event/", delete_event),  # Delete event

    path("get-artists/", get_artists),  # Get all artists
    path("add-artist/", add_artist),  # Add a new artist
    path("update-artist/", update_artist),  # Update artist info
    path("delete-artist/", delete_artist),  # Delete artist
    path("get-artifacts-for-artist/", get_artifacts_for_artist),  # Get artifacts associated with a given artist

    path("get-employee-info/", get_employee_info),  # Get logged-in employee info

    path("record-edit-artifact/", record_edit_artifact),  # Log edit made to an artifact
    path("record-edit-event/", record_edit_event),  # Log edit made to an event
    path("record-edit-exhibit/", record_edit_exhibit),  # Log edit made to an exhibit
    path("get-edit-logs/", get_edit_logs),  # Retrieve all edit logs

    path("get-all-artifacts/", get_all_artifacts),  # Get all artifacts in system (admin/visitor)
    path("get-all-events/", get_all_events),  # Get all events in system
    path("get-all-exhibits/", get_all_exhibits),  # Get all exhibits in system
    path("get-all-museums/", get_all_museums),  # Get all museums in system
    path("get-all-visitors/", get_all_visitors),  # Get all visitors in system

    path("get-visited-museums/", get_visited_museums),  # Get museums visited by current visitor
    path("add-visited-museum/", add_visited_museum),  # Mark museum as visited
    path("delete-visited-museum/", delete_visited_museum),  # Remove a visited museum record

    path("submit-artifact-review/", submit_artifact_review),  # Submit review for an artifact
    path("delete-artifact-review/", delete_artifact_review),  # Delete artifact review
    path('get-visitor-artifact-reviews/', get_visitor_artifact_reviews),  # Get all reviews submitted by a visitor
    path("get-artifact-reviews/", get_artifact_reviews),  # Get all reviews for an artifact

    path("submit-event-review/", submit_event_review),  # Submit review for an event
    path("get-event-reviews/", get_event_reviews),  # Get all reviews for an event
    path("delete-event-review/", delete_event_review),  # Delete event review
    path('get-visitor-event-reviews/', get_visitor_event_reviews),  # Get all reviews submitted by a visitor

    # JWT authentication endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),  # Login/token creation
    path('token/refresh/', CustomTokenObtainPairView.as_view(), name='token_refresh'),  # Refresh JWT token
]
