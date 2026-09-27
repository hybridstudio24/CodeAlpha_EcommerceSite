from django.contrib.auth import views as auth_views
from django.urls import path
from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("api/products/", views.product_list, name="product-list"),
    path("api/checkout/", views.checkout, name="checkout"),
    path("api/newsletter/", views.newsletter_signup, name="newsletter"),
    path("signup/", views.signup, name="signup"),
    path("account/", views.account, name="account"),
    path("login/", auth_views.LoginView.as_view(template_name="store/login.html"), name="login"),
    path("logout/", auth_views.LogoutView.as_view(next_page="index"), name="logout"),
]
