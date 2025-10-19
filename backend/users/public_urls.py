from django.urls import path
from .views import PublicTeacherList

urlpatterns = [
    path('teachers/', PublicTeacherList.as_view(), name='public-approved-teachers'),
]

