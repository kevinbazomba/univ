from django.urls import path
from . import views

urlpatterns = [
    path('', views.react_app),
    path('universite/', views.identite_universite, name='identite-universite'),
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('logout/', views.logout, name='logout'),
    path('profile/', views.get_profile, name='profile'),
    path('refresh/', views.refresh_token, name='refresh'),
]
