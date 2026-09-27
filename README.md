# CodeAlpha_EcommerceSite

An e-commerce storefront built as a CodeAlpha internship task — a plant & home-goods shop ("Foliage") with a Django backend, a database-driven product catalog, a shopping cart, checkout, and user accounts.

## Features

- **Product catalog** — products are stored in the database and managed through the Django admin, not hardcoded.
- **Shopping cart** — add/remove items, adjust quantity, live subtotal, all client-side with a slide-out drawer.
- **Checkout** — places a real order in the database, priced server-side from the product table (never trusts a price sent from the browser).
- **User accounts** — sign up, log in, log out, and a personal account page showing order history.
- **Newsletter signup** — captures emails to a `Subscriber` table.
- **Admin dashboard** — full CRUD on products, orders, and subscribers via Django's built-in `/admin/`.

## Tech stack

| Layer      | Technology                         |
|------------|-------------------------------------|
| Backend    | Django 5.2 (Python)                 |
| Database   | SQLite (default, file-based)        |
| Frontend   | HTML, CSS, vanilla JavaScript       |
| Auth       | Django's built-in authentication    |

## Project structure

```
foliage-site/
├── manage.py
├── requirements.txt
├── foliage_project/       # Django project settings & root URLs
└── store/                 # Main app
    ├── models.py          # Product, Subscriber, Order, OrderItem
    ├── views.py           # Pages + JSON API endpoints
    ├── urls.py
    ├── forms.py           # Signup form
    ├── admin.py
    ├── templates/store/   # index, login, signup, account pages
    └── static/store/      # styles.css, script.js
```

## API endpoints

| Method | Endpoint            | Description                          |
|--------|----------------------|---------------------------------------|
| GET    | `/api/products/`     | List in-stock products as JSON        |
| POST   | `/api/checkout/`     | Create an order from the cart         |
| POST   | `/api/newsletter/`   | Subscribe an email address            |

## Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/hybridstudio24/CodeAlpha_EcommerceSite.git
   cd CodeAlpha_EcommerceSite
   ```

2. **Create and activate a virtual environment**
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\Activate.ps1
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create an admin account**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the server**
   ```bash
   python manage.py runserver
   ```

7. Visit `http://127.0.0.1:8000/admin/`, log in, and add a few products under **Store → Products**.

8. Visit `http://127.0.0.1:8000/` to see the storefront.

## Notes

- `db.sqlite3` is excluded from version control (see `.gitignore`), so the database starts empty on a fresh clone — add products via the admin panel after setup.
- This uses Django's development server (`runserver`), which is not intended for production use.
