from django.urls import path
from .views import index, create_wallet, create_smart_wallet, wallet_created

urlpatterns = [
    path('', index, name='index'),
    path('create_wallet/', create_wallet, name='create_wallet'),
    path('wallet_created/', wallet_created, name='wallet_created'),
    path('create_smart_wallet/', create_smart_wallet, name='create_smart_wallet'),
]
