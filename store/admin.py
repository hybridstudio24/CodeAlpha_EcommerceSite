from django.contrib import admin
from .models import Product, Subscriber, Order, OrderItem


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "price", "tag", "in_stock", "created_at")
    list_filter = ("in_stock", "tag")
    search_fields = ("name",)


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ("email", "created_at")


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "created_at")
    inlines = [OrderItemInline]
