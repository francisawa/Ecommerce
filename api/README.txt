PHP + MySQL API (SiteGround)

1) Copy api/config.example.php to api/config.php and fill in:
   - MySQL host/user/password
   - Admin username + password_hash
   - token_secret (random)

2) Upload the api/ folder into public_html/api/

Endpoints:
- POST  /api/admin_login.php            -> { token }
- GET   /api/products.php               -> public products
- POST  /api/products.php               -> admin create
- PUT   /api/products.php?id=123        -> admin update
- DELETE/api/products.php?id=123        -> admin delete
- POST  /api/orders.php                 -> public order create
- GET   /api/orders.php                 -> admin list orders
- POST  /api/messages.php               -> public message create
- GET   /api/messages.php               -> admin list messages
- GET   /api/clients.php                -> admin list clients

Notes:
- All admin endpoints require header: Authorization: Bearer <token>
- This API auto-creates tables on first request.
