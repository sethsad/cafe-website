# Cafe Aroma

Static GitHub Pages preview for the Cafe Aroma website.

## GitHub Pages

This repository includes a root `index.html` so GitHub Pages can serve the public cafe site.

The PHP API and MySQL database files are kept for full hosting later, but GitHub Pages does not run PHP or MySQL. For the full admin dashboard, login, orders, and database features, deploy the project to a PHP/MySQL host and import `database/cafe_aroma.sql`.

## Publish

```powershell
git add .
git commit -m "Prepare Cafe Aroma for GitHub Pages"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/cafe-website.git
git push -u origin main
```

Then enable Pages in GitHub under **Settings > Pages**, using branch `main` and folder `/root`.
