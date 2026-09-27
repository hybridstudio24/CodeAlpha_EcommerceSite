import json
from decimal import Decimal

from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .forms import SignUpForm
from .models import Product, Subscriber, Order, OrderItem


@ensure_csrf_cookie
def index(request):
    """Render the storefront shell. Products are then fetched client-side.
    ensure_csrf_cookie guarantees the csrftoken cookie is set so script.js
    can read it and attach it to POST requests (checkout, newsletter)."""
    return render(request, "store/index.html")


@require_GET
def product_list(request):
    products = Product.objects.filter(in_stock=True)
    return JsonResponse([p.to_dict() for p in products], safe=False)


@require_POST
def checkout(request):
    """
    Expects JSON: { "email": "...", "items": [{ "id": "3", "qty": 2 }, ...] }
    Creates an Order + OrderItems priced from the database (never trust
    a price sent from the browser).
    """
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    items = payload.get("items", [])
    if not items:
        return JsonResponse({"error": "Cart is empty"}, status=400)

    order = Order.objects.create(
        user=request.user if request.user.is_authenticated else None,
        email=payload.get("email", ""),
    )
    for entry in items:
        try:
            product = Product.objects.get(id=entry["id"])
        except (Product.DoesNotExist, KeyError, ValueError):
            continue
        OrderItem.objects.create(
            order=order,
            product=product,
            quantity=max(1, int(entry.get("qty", 1))),
            unit_price=product.price,
        )

    return JsonResponse({"order_id": order.id, "total": float(order.total())}, status=201)


@require_POST
def newsletter_signup(request):
    try:
        payload = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    email = payload.get("email", "").strip()
    if not email:
        return JsonResponse({"error": "Email is required"}, status=400)

    Subscriber.objects.get_or_create(email=email)
    return JsonResponse({"status": "subscribed"}, status=201)


def signup(request):
    if request.method == "POST":
        form = SignUpForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect("account")
    else:
        form = SignUpForm()
    return render(request, "store/signup.html", {"form": form})


@login_required
def account(request):
    orders = request.user.orders.prefetch_related("items__product").order_by("-created_at")
    return render(request, "store/account.html", {"orders": orders})
