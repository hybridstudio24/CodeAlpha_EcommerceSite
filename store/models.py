from django.conf import settings
from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=200)
    meta = models.CharField(max_length=200, blank=True)  # e.g. "6" pot · low light"
    price = models.DecimalField(max_digits=8, decimal_places=2)
    tag = models.CharField(max_length=40, blank=True)  # e.g. "New", "Best seller"
    in_stock = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    def to_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
            "meta": self.meta,
            "price": float(self.price),
            "tag": self.tag,
        }


class Subscriber(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email


class Order(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="orders",
    )
    email = models.EmailField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def total(self):
        return sum(item.line_total() for item in self.items.all())

    def __str__(self):
        return f"Order #{self.id}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name="items", on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)  # snapshot at purchase time

    def line_total(self):
        return self.unit_price * self.quantity
