<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Link - threepeakviews.com</title>
    <link rel="stylesheet" href="styles.css">
    <script defer="" crossorigin="" src="https://static.parastorage.com/unpkg/@sentry/browser@6.19.7/build/bundle.min.js"></script>
</head>
<body class="page-password-reset-link">
    <header>
    <h1>threepeakviews.com</h1>

    <button class="hamburger" aria-label="Toggle navigation menu" aria-expanded="false">
        <span></span>
        <span></span>
        <span></span>
    </button>

    <nav class="main-nav" aria-label="Main navigation">
        <a href="index.html">Home</a>

        <div class="nav-dropdown">
            <a href="shop.html" aria-haspopup="true">Shop </a>
            <div class="dropdown-content">
                <a href="shop.html">Browse Products</a>
                <a href="auctions.html">Auctions</a>
                <a href="paintings.html">Paintings</a>
                <a href="Eagle_Shop.html">  Eagle Shop</a>
            </div>
        </div>

        <a href="contact.html">Contact</a>

        <div class="nav-dropdown">
            <a href="about.html" aria-haspopup="true">About </a>
            <div class="dropdown-content">
                <a href="about.html">Our Story</a>
                <a href="about.html#mission">Our Mission</a>
                <a href="about.html#team">Our Team</a>
            </div>
        </div>

        <a href="account.html">Account</a>
        <a href="admin.html">Admin</a>
    </nav>
</header>

    <main class="p-20">
        <div class="card">
            <h2>Password Reset (Temporary)</h2>
            <p>This is a temporary reset link page for local testing before deployment.</p>
            <p>Use the password reset form to request a new link:</p>
            <p><a href="password-reset.html">Go to password reset form</a></p>
        </div>
    </main>

    <footer>
        <p>&copy; 2026 threepeakviews.com. All rights reserved. | <a href="privacy.html" class="footer-link">Privacy Policy</a> | <a href="terms.html" class="footer-link">Terms of Service</a></p>
    </footer>

    <script src="scripts.js"></script>
</body>
</html>

