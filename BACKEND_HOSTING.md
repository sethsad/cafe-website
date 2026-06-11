# Cafe Aroma Backend Hosting

GitHub Pages can host only the static website. The admin login, products, orders, invoices, and store settings need a PHP + MySQL host.

## What You Need

- PHP 8.0 or newer
- MySQL or MariaDB
- PDO MySQL enabled
- phpMyAdmin or another way to import SQL

## Upload These Files

Upload these project folders/files to your hosting `public_html` folder:

- `index.html`
- `HTML/`
- `CSS/`
- `JS/`
- `img/`
- `api/`
- `database/cafe_aroma.sql`

## Database Setup

1. Create a MySQL database in your hosting control panel.
2. Create a database user and give it full access to the database.
3. Open phpMyAdmin.
4. Import `database/cafe_aroma.sql`.
5. Edit `api/config.php` with your host database values:

```php
define('DB_HOST', 'localhost');
define('DB_PORT', 3306);
define('DB_NAME', 'your_database_name');
define('DB_USER', 'your_database_user');
define('DB_PASS', 'your_database_password');
```

Some hosts use a database host like `localhost`, while others give a custom host name.

## Test The Backend

Open:

```text
https://your-domain.com/api/health.php
```

Expected result:

```json
{
  "ok": true,
  "service": "Cafe Aroma PHP API"
}
```

Then test login:

```text
https://your-domain.com/HTML/login.html
```

Default login:

```text
username: admin
password: cafe123
```

Change this password after your first real deployment.

## Important

The backend cannot run on GitHub Pages. Keep GitHub Pages for the public static preview, and use a PHP/MySQL host for the full working admin dashboard.
