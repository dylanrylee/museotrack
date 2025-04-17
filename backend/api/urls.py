from django.contrib import admin
from django.urls import path
from .views import *
from .views import CustomTokenObtainPairView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('login-visitor/', login_visitor),
    path('register-visitor/', register_visitor),
    path('browse-visited-museums/', browse_visited_museums),
    path('login-supervisor-employee/', login_supervisor_employee),
    path('register-supervisor/', register_supervisor),
    path('get-supervisor-employees/', get_supervisor_employees),
    path('get-supervisor-info/', get_supervisor_info),
    
    # JWT auth endpoints
    path('token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', CustomTokenObtainPairView.as_view(), name='token_refresh'),
]
