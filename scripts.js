// Product Data - Default Products
const defaultProducts = [
    { id: 1, name: 'Premium Shoes', price: 89.99, category: 'footwear', image: '👟', description: 'Comfortable and stylish premium shoes' },
    { id: 2, name: 'Classic Shirt', price: 34.99, category: 'clothing', image: '👕', description: 'High-quality cotton shirt' },
    { id: 3, name: 'Denim Jeans', price: 59.99, category: 'clothing', image: '👖', description: 'Classic blue denim jeans' },
    { id: 4, name: 'Winter Jacket', price: 129.99, category: 'outerwear', image: '🧥', description: 'Warm and waterproof winter jacket' },
    { id: 5, name: 'Casual Hat', price: 24.99, category: 'accessories', image: '🧢', description: 'Comfortable casual baseball hat' },
    { id: 6, name: 'Leather Belt', price: 44.99, category: 'accessories', image: '⌚', description: 'Premium leather belt' },
    { id: 7, name: 'Sports Watch', price: 199.99, category: 'accessories', image: '⌚', description: 'Digital sports watch with timer' },
    { id: 8, name: 'Sunglasses', price: 89.99, category: 'accessories', image: '😎', description: 'UV-protected sunglasses' },
    { id: 9, name: 'Wool Sweater', price: 74.99, category: 'clothing', image: '🧶', description: 'Cozy wool sweater' },
    { id: 10, name: 'Running Shoes', price: 99.99, category: 'footwear', image: '🏃', description: 'High-performance running shoes' },
    { id: 11, name: 'Gold Necklace', price: 249.99, category: 'jewelry', image: '⛓️', description: 'Elegant 18k gold necklace with pendant' },
    { id: 12, name: 'Diamond Earrings', price: 399.99, category: 'jewelry', image: '💎', description: 'Premium diamond stud earrings' },
    { id: 13, name: 'Silver Ring', price: 149.99, category: 'jewelry', image: '💍', description: 'Stunning sterling silver ring' },
    { id: 14, name: 'Pearl Bracelet', price: 179.99, category: 'jewelry', image: '✨', description: 'Luxurious freshwater pearl bracelet' },
    { id: 15, name: 'Sapphire Pendant', price: 299.99, category: 'jewelry', image: '🔵', description: 'Beautiful blue sapphire pendant' },
];

// Load products from localStorage, or use default products
let products = [];
function loadProducts() {
    const saved = localStorage.getItem('products');
    if (saved) {
        products = JSON.parse(saved).map(product => ({
            ...product,
            image: product.image || product.icon || '📦'
        }));
    } else {
        products = JSON.parse(JSON.stringify(defaultProducts));
        localStorage.setItem('products', JSON.stringify(products));
    }
}

// Initialize products on script load
loadProducts();

// Cart Management
class Cart {
    constructor() {
        this.items = this.loadCart();
    }

    loadCart() {
        const saved = localStorage.getItem('cart');
        return saved ? JSON.parse(saved) : [];
    }

    saveCart() {
        localStorage.setItem('cart', JSON.stringify(this.items));
    }

    addItem(product, quantity = 1) {
        const existing = this.items.find(i => i.id === product.id);
        if (existing) {
            existing.quantity += quantity;
        } else {
            this.items.push({ ...product, quantity });
        }
        this.saveCart();
        this.updateUI();
    }

    removeItem(productId) {
        this.items = this.items.filter(i => i.id !== productId);
        this.saveCart();
        this.updateUI();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(i => i.id === productId);
        if (item) {
            item.quantity = Math.max(1, quantity);
            this.saveCart();
            this.updateUI();
        }
    }

    getTotal() {
        return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    getCount() {
        return this.items.reduce((sum, item) => sum + item.quantity, 0);
    }

    clear() {
        this.items = [];
        this.saveCart();
        this.updateUI();
    }

    updateUI() {
        const countElems = document.querySelectorAll('#cart-count');
        const totalElems = document.querySelectorAll('#cart-total');
        const cartItemsElem = document.getElementById('cart-items');
        const cartSummaryElem = document.getElementById('cart-summary-total');

        countElems.forEach(elem => elem.textContent = this.getCount());
        totalElems.forEach(elem => elem.textContent = this.getTotal().toFixed(2));

        if (cartItemsElem) {
            cartItemsElem.innerHTML = '';
            this.items.forEach(item => {
                const li = document.createElement('li');
                li.id = 'cart-item-' + item.id;

                const label = document.createElement('span');
                label.textContent = `${item.name}: $${item.price.toFixed(2)} x${item.quantity}`;

                const removeBtn = document.createElement('button');
                removeBtn.type = 'button';
                removeBtn.className = 'remove-btn';
                removeBtn.textContent = 'Remove';
                removeBtn.addEventListener('click', () => this.removeItem(item.id));

                li.appendChild(label);
                li.appendChild(removeBtn);
                cartItemsElem.appendChild(li);
            });
        }

        if (cartSummaryElem) {
            cartSummaryElem.textContent = this.getTotal().toFixed(2);
        }
    }
}

const cart = new Cart();

// Initialize Cart UI on Page Load
window.addEventListener('load', function() {
    loadProducts();
    cart.updateUI();
});

// Product Listing
function renderProducts(productsToShow = products) {
    const productsDiv = document.getElementById('products-container');
    if (!productsDiv) return;

    productsDiv.innerHTML = '';
    productsToShow.forEach(product => {
        const div = document.createElement('div');
        div.className = 'product';
        div.innerHTML = `
            <div class="product-icon">${product.image}</div>
            <h3>${product.name}</h3>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <p class="product-description">${product.description}</p>
            <input type="number" id="qty-${product.id}" value="1" min="1" max="10" class="qty-input">
        `;

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'add-btn';
        addBtn.textContent = 'Add to Cart';
        addBtn.addEventListener('click', () => addToCart(product.id));
        div.appendChild(addBtn);
        productsDiv.appendChild(div);
    });
}

// Add to Cart Handler
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const qtyElem = document.getElementById('qty-' + productId);
    const qty = qtyElem ? parseInt(qtyElem.value) : 1;
    
    if (product) {
        cart.addItem(product, qty);
        alert(product.name + ' added to cart!');
        if (qtyElem) qtyElem.value = 1;
    }
}

// Filter Products
function filterByCategory(category) {
    if (category === 'all') {
        renderProducts(products);
    } else {
        renderProducts(products.filter(p => p.category === category));
    }
}

// Search Products
function searchProducts(query) {
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.description.toLowerCase().includes(query.toLowerCase())
    );
    renderProducts(filtered);
}

// Checkout
function checkout() {
    if (cart.items.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    localStorage.setItem('checkout-items', JSON.stringify(cart.items));
    localStorage.setItem('checkout-total', cart.getTotal().toFixed(2));
    window.location.href = 'checkout-secure.html';
}

// Order Summary (for checkout page)
function displayOrderSummary() {
    const items = JSON.parse(localStorage.getItem('checkout-items') || '[]');
    const total = parseFloat(localStorage.getItem('checkout-total') || '0');
    
    const summaryDiv = document.getElementById('order-summary');
    if (!summaryDiv) return;

    summaryDiv.innerHTML = '<h2>Order Summary</h2>';
    if (items.length === 0) {
        summaryDiv.innerHTML += '<p>No items in order.</p>';
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'order-item';
        div.innerHTML = `
            <span>${item.name}</span>
            <span>$${item.price.toFixed(2)} x ${item.quantity}</span>
            <span class="item-total">$${(item.price * item.quantity).toFixed(2)}</span>
        `;
        summaryDiv.appendChild(div);
    });

    const totalDiv = document.createElement('div');
    totalDiv.className = 'order-total';
    totalDiv.innerHTML = `<strong>Total: $${total}</strong>`;
    summaryDiv.appendChild(totalDiv);
}

// Process Order
function processOrder() {
    const name = document.getElementById('customer-name').value;
    const email = document.getElementById('customer-email').value;
    const address = document.getElementById('customer-address').value;

    if (!name || !email || !address) {
        alert('Please fill in all fields');
        return;
    }

    const order = {
        id: 'ORDER-' + Date.now(),
        customer: { name, email, address },
        items: JSON.parse(localStorage.getItem('checkout-items') || '[]'),
        total: parseFloat(localStorage.getItem('checkout-total') || '0'),
        date: new Date().toLocaleDateString()
    };

    // Save order (in real app, send to server)
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Clear checkout
    localStorage.removeItem('checkout-items');
    localStorage.removeItem('checkout-total');
    cart.clear();

    alert('Order placed successfully! Order ID: ' + order.id);
    window.location.href = 'index.html';
}

function initCheckoutPage() {
    const backBtn = document.getElementById('checkoutBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'shop.html';
        });
    }

    const purchaseBtn = document.getElementById('completePurchaseBtn');
    if (purchaseBtn) {
        purchaseBtn.addEventListener('click', processOrder);
    }
}

// Load Products on Shop Page
window.addEventListener('load', function() {
    if (document.getElementById('products-container')) {
        renderProducts();
    }
    if (document.getElementById('order-summary')) {
        displayOrderSummary();
    }
});

// ============================================================================
// Page-Specific UI Logic (moved from inline scripts)
// ============================================================================

function initDropdowns() {
    const toggles = document.querySelectorAll('.nav-dropdown > a');
    if (!toggles.length) return;

    toggles.forEach(toggle => {
        toggle.addEventListener('click', function(e) {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                const dropdown = this.parentElement;
                dropdown.classList.toggle('active');
                document.querySelectorAll('.nav-dropdown').forEach(d => {
                    if (d !== dropdown) d.classList.remove('active');
                });
            }
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.nav-dropdown')) {
            document.querySelectorAll('.nav-dropdown').forEach(d => {
                d.classList.remove('active');
            });
        }
    });
}

function initHomePage() {
    const hamburger = document.querySelector('.hamburger');
    const nav = document.querySelector('.main-nav');
    if (!hamburger || !nav) return;

    hamburger.addEventListener('click', () => {
        const expanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !expanded);
        nav.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('header')) {
            nav.classList.remove('active');
            hamburger.setAttribute('aria-expanded', 'false');
        }
    });
}

function initIndexPage() {
    const heroBtn = document.getElementById('heroShopBtn');
    if (heroBtn) {
        heroBtn.addEventListener('click', goToShop);
    }

    const grid = document.getElementById('featured-grid');
    if (!grid) return;

    const featured = products.slice(0, 6);
    featured.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-card-content">
                <div class="product-icon">${product.image}</div>
                <h3>${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
            </div>
        `;

        const viewBtn = document.createElement('button');
        viewBtn.type = 'button';
        viewBtn.className = 'product-btn';
        viewBtn.textContent = 'View in Shop';
        viewBtn.addEventListener('click', goToShop);
        card.querySelector('.product-card-content').appendChild(viewBtn);
        grid.appendChild(card);
    });
}

function goToShop() {
    window.location.href = 'shop.html';
}

function initShopPage() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const checkoutBtn = document.getElementById('checkout-btn');
    const noResults = document.getElementById('no-results');
    if (!searchInput || !categoryButtons.length) return;

    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            renderProducts(products);
            if (noResults) noResults.classList.add('is-hidden');
            return;
        }

        const filtered = products.filter(p =>
            p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.description.toLowerCase().includes(query.toLowerCase())
        );

        renderProducts(filtered);
        if (noResults) {
            noResults.classList.toggle('is-hidden', filtered.length > 0);
        }
    }

    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const category = this.getAttribute('data-category');
            if (category === 'all') {
                renderProducts(products);
            } else {
                renderProducts(products.filter(p => p.category === category));
            }
        });
    });

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', checkout);
    }

    loadProducts();
    renderProducts(products);
    cart.updateUI();
    displayShopUserStatus();
}

function displayShopUserStatus() {
    const userStatusDiv = document.getElementById('user-status');
    if (!userStatusDiv) return;
    const currentUser = localStorage.getItem('currentUser');
    const isGuest = localStorage.getItem('isGuest') === 'true';

    userStatusDiv.innerHTML = '';

    if (currentUser && !isGuest) {
        const user = JSON.parse(currentUser);
        const userEmail = user.email || 'User';

        const label = document.createElement('span');
        label.textContent = `👤 Logged in as: ${userEmail}`;

        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Logout';
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });

        userStatusDiv.appendChild(label);
        userStatusDiv.appendChild(document.createTextNode(' '));
        userStatusDiv.appendChild(logoutLink);
    } else if (isGuest) {
        const label = document.createElement('span');
        label.textContent = '🚶 Guest Mode';

        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Logout';
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logoutUser();
        });

        userStatusDiv.appendChild(label);
        userStatusDiv.appendChild(document.createTextNode(' '));
        userStatusDiv.appendChild(logoutLink);
    } else {
        const label = document.createElement('span');
        label.className = 'text-xs opacity-80';
        label.textContent = 'Not logged in';
        userStatusDiv.appendChild(label);
    }
}

function logoutUser() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isGuest');
    if (typeof displayShopUserStatus === 'function') {
        displayShopUserStatus();
    }
    ensureLogoutLink();
}

function ensureLogoutLink() {
    const currentUser = localStorage.getItem('currentUser');
    const isGuest = localStorage.getItem('isGuest') === 'true';
    const shouldShow = !!currentUser || isGuest;

    document.querySelectorAll('nav').forEach(nav => {
        const existing = nav.querySelector('.logout-link');
        if (!shouldShow) {
            if (existing) existing.remove();
            return;
        }

        if (!existing) {
            const link = document.createElement('a');
            link.href = '#';
            link.className = 'logout-link';
            link.textContent = 'Logout';
            link.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
            });
            nav.appendChild(link);
        }
    });
}

function initAccountPage() {
    const signupForm = document.getElementById('signupForm');
    const loginForm = document.getElementById('loginForm');
    if (!signupForm || !loginForm) return;

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    function switchTab(tabName) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    window.switchTab = switchTab;

    document.querySelectorAll('[data-tab-target]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-tab-target');
            if (target) switchTab(target);
        });
    });

    const signupPassword = document.getElementById('signupPassword');
    const passwordStrength = document.getElementById('passwordStrength');
    if (signupPassword && passwordStrength) {
        signupPassword.addEventListener('input', function() {
            const password = this.value;
            if (password.length < 8) {
                passwordStrength.textContent = '⚠️ Weak - Minimum 8 characters';
                passwordStrength.className = 'password-strength weak';
            } else if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
                passwordStrength.textContent = '⚡ Medium - Add uppercase and numbers';
                passwordStrength.className = 'password-strength medium';
            } else {
                passwordStrength.textContent = '✓ Strong - Great password!';
                passwordStrength.className = 'password-strength strong';
            }
        });
    }

    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const firstName = document.getElementById('firstName').value;
        const lastName = document.getElementById('lastName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showAlert('signupAlert', 'Passwords do not match!', 'error');
            return;
        }

        if (password.length < 8) {
            showAlert('signupAlert', 'Password must be at least 8 characters!', 'error');
            return;
        }

        const account = {
            id: 'USER-' + Date.now(),
            firstName,
            lastName,
            email,
            password: btoa(password),
            phone: document.getElementById('phone').value,
            country: document.getElementById('country').value,
            createdAt: new Date().toISOString(),
            newsletter: document.getElementById('newsCheckbox').checked
        };

        const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        if (accounts.some(acc => acc.email === email)) {
            showAlert('signupAlert', 'Email already registered!', 'error');
            return;
        }

        accounts.push(account);
        localStorage.setItem('accounts', JSON.stringify(accounts));
        localStorage.setItem('currentUser', JSON.stringify(account));

        showAlert('signupAlert', '✓ Account created successfully! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'shop.html';
        }, 2000);
    });

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        const account = accounts.find(acc => acc.email === email && acc.password === btoa(password));

        if (!account) {
            showAlert('loginAlert', 'Invalid email or password!', 'error');
            return;
        }

        localStorage.setItem('currentUser', JSON.stringify(account));
        showAlert('loginAlert', '✓ Signed in successfully! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'shop.html';
        }, 2000);
    });

    window.continueAsGuest = function() {
        const guestUser = {
            id: 'GUEST-' + Date.now(),
            name: 'Guest User',
            isGuest: true,
            createdAt: new Date().toISOString()
        };

        localStorage.setItem('currentUser', JSON.stringify(guestUser));
        window.location.href = 'shop.html';
    };

    document.querySelectorAll('[data-action="guest"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.continueAsGuest();
        });
    });

    function showAlert(elementId, message, type) {
        const alert = document.getElementById(elementId);
        alert.textContent = message;
        alert.className = `alert show ${type}`;
    }
}

function initSignupPage() {
    const clientForm = document.getElementById('clientSignupForm');
    const adminForm = document.getElementById('adminSignupForm');
    if (!clientForm || !adminForm) return;

    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    function switchTab(tabName) {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-content').forEach(c => c.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(tabName).classList.add('active');
    }

    const initialTab = window.location.hash.replace('#', '');
    if (initialTab === 'admin' || initialTab === 'client') {
        switchTab(initialTab);
    }

    function showAlert(elementId, message, type) {
        const alert = document.getElementById(elementId);
        alert.textContent = message;
        alert.className = `alert show ${type}`;
    }

    function updateStrength(inputId, outputId) {
        const password = document.getElementById(inputId).value;
        const strengthDiv = document.getElementById(outputId);

        if (password.length < 8) {
            strengthDiv.textContent = 'Weak - minimum 8 characters';
            strengthDiv.className = 'password-strength weak';
        } else if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
            strengthDiv.textContent = 'Medium - add uppercase and numbers';
            strengthDiv.className = 'password-strength medium';
        } else {
            strengthDiv.textContent = 'Strong password';
            strengthDiv.className = 'password-strength strong';
        }
    }

    document.getElementById('clientPassword').addEventListener('input', () => {
        updateStrength('clientPassword', 'clientPasswordStrength');
    });

    document.getElementById('adminPassword').addEventListener('input', () => {
        updateStrength('adminPassword', 'adminPasswordStrength');
    });

    clientForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const firstName = document.getElementById('clientFirstName').value;
        const lastName = document.getElementById('clientLastName').value;
        const email = document.getElementById('clientEmail').value;
        const password = document.getElementById('clientPassword').value;
        const confirmPassword = document.getElementById('clientConfirmPassword').value;

        if (password !== confirmPassword) {
            showAlert('clientAlert', 'Passwords do not match.', 'error');
            return;
        }

        if (password.length < 8) {
            showAlert('clientAlert', 'Password must be at least 8 characters.', 'error');
            return;
        }

        const account = {
            id: 'USER-' + Date.now(),
            firstName,
            lastName,
            email,
            password: btoa(password),
            phone: document.getElementById('clientPhone').value,
            country: document.getElementById('clientCountry').value,
            createdAt: new Date().toISOString()
        };

        const accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        if (accounts.some(acc => acc.email === email)) {
            showAlert('clientAlert', 'Email already registered.', 'error');
            return;
        }

        accounts.push(account);
        localStorage.setItem('accounts', JSON.stringify(accounts));
        localStorage.setItem('currentUser', JSON.stringify(account));

        showAlert('clientAlert', 'Client account created. Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'shop.html';
        }, 2000);
    });

    adminForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('adminFullName').value.trim();
        const email = document.getElementById('adminEmail').value.trim();
        const password = document.getElementById('adminPassword').value;
        const confirmPassword = document.getElementById('adminConfirmPassword').value;

        if (password !== confirmPassword) {
            showAlert('adminAlert', 'Passwords do not match.', 'error');
            return;
        }

        if (password.length < 8) {
            showAlert('adminAlert', 'Password must be at least 8 characters.', 'error');
            return;
        }

        const adminAccount = {
            id: 'ADMIN-' + Date.now(),
            username: name,
            email,
            password: btoa(password),
            createdAt: new Date().toISOString()
        };

        const admins = JSON.parse(localStorage.getItem('adminAccounts') || '[]');
        const nameLower = name.toLowerCase();
        const emailLower = email.toLowerCase();

        if (admins.some(acc => acc.username.toLowerCase() === nameLower || acc.email.toLowerCase() === emailLower)) {
            showAlert('adminAlert', 'Admin account already exists.', 'error');
            return;
        }

        admins.push(adminAccount);
        localStorage.setItem('adminAccounts', JSON.stringify(admins));

        showAlert('adminAlert', 'Admin account created. Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'admin.html';
        }, 2000);
    });
}

function initAdminPage() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    const DEFAULT_ADMINS = [
        { username: 'demo-admin', password: 'demo-1234' },
        { username: 'admin', password: 'demo-1234' },
        { username: 'administrator', password: 'demo-1234' },
        { username: 'administrater', password: 'demo-1234' }
    ];

    let currentAdminName = 'Admin';
    const adminDefaultProducts = [
        { id: 1, name: 'Premium Shoes', price: 89.99, category: 'footwear', icon: '👟', description: 'Comfortable and stylish premium shoes' },
        { id: 2, name: 'Classic Shirt', price: 34.99, category: 'clothing', icon: '👕', description: 'High-quality cotton shirt' },
        { id: 3, name: 'Denim Jeans', price: 59.99, category: 'clothing', icon: '👖', description: 'Classic blue denim jeans' },
        { id: 4, name: 'Winter Jacket', price: 129.99, category: 'outerwear', icon: '🧥', description: 'Warm and waterproof winter jacket' },
        { id: 5, name: 'Casual Hat', price: 24.99, category: 'accessories', icon: '🧢', description: 'Comfortable casual baseball hat' },
        { id: 6, name: 'Leather Belt', price: 44.99, category: 'accessories', icon: '⌚', description: 'Premium leather belt' },
        { id: 7, name: 'Sports Watch', price: 199.99, category: 'accessories', icon: '⌚', description: 'Digital sports watch with timer' },
        { id: 8, name: 'Sunglasses', price: 89.99, category: 'accessories', icon: '😎', description: 'UV-protected sunglasses' },
        { id: 9, name: 'Wool Sweater', price: 74.99, category: 'clothing', icon: '🧶', description: 'Cozy wool sweater' },
        { id: 10, name: 'Running Shoes', price: 99.99, category: 'footwear', icon: '🏃', description: 'High-performance running shoes' },
        { id: 11, name: 'Gold Necklace', price: 249.99, category: 'jewelry', icon: '⛓️', description: 'Elegant 18k gold necklace with pendant' },
        { id: 12, name: 'Diamond Earrings', price: 399.99, category: 'jewelry', icon: '💎', description: 'Premium diamond stud earrings' },
        { id: 13, name: 'Silver Ring', price: 149.99, category: 'jewelry', icon: '💍', description: 'Stunning sterling silver ring' },
        { id: 14, name: 'Pearl Bracelet', price: 179.99, category: 'jewelry', icon: '✨', description: 'Luxurious freshwater pearl bracelet' },
        { id: 15, name: 'Sapphire Pendant', price: 299.99, category: 'jewelry', icon: '🔵', description: 'Beautiful blue sapphire pendant' }
    ];
    let products = [];

    function loadData() {
        const saved = localStorage.getItem('products');
        if (saved) {
            try {
                products = JSON.parse(saved).map(p => ({
                    ...p,
                    icon: p.icon || p.image || '📦'
                }));
                return;
            } catch (e) {
                console.error('Invalid products data in localStorage');
            }
        }

        products = JSON.parse(JSON.stringify(adminDefaultProducts));
        saveData();
    }

    function saveData() {
        localStorage.setItem('products', JSON.stringify(products));
    }

    function showMessage(elementId, text, type = 'success') {
        const el = document.getElementById(elementId);
        if (!el) return;
        el.textContent = text;
        el.className = `message ${type}`;
        el.style.display = 'block';
        setTimeout(() => el.style.display = 'none', 4500);
    }

    function normalizeName(value) {
        return value.trim().toLowerCase();
    }

    function findAdminAccount(name, password) {
        const normalized = normalizeName(name);
        const defaultMatch = DEFAULT_ADMINS.find(admin => admin.username === normalized && admin.password === password);
        if (defaultMatch) return { username: name };

        const accounts = JSON.parse(localStorage.getItem('adminAccounts') || '[]');
        return accounts.find(acc => {
            const userMatch = acc.username && acc.username.toLowerCase() === normalized;
            const emailMatch = acc.email && acc.email.toLowerCase() === normalized;
            return (userMatch || emailMatch) && acc.password === btoa(password);
        });
    }

    const handleLogin = function(e) {
        e.preventDefault();
        const name = document.getElementById('adminName').value.trim();
        const pw = document.getElementById('adminPassword').value.trim();
        const msg = document.getElementById('loginMessage');
        const account = findAdminAccount(name, pw);

        if (account) {
            currentAdminName = account.username || name || 'Admin';
            document.getElementById('adminNameDisplay').textContent = currentAdminName;
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'block';
            loadProductsTable();
        } else {
            msg.textContent = 'Incorrect username or password';
            msg.className = 'message error';
            msg.style.display = 'block';
            document.getElementById('adminPassword').value = '';
            document.getElementById('adminPassword').focus();
        }
    };

    const handleLogout = function() {
        if (!confirm('Are you sure you want to logout?')) return;
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'block';
        document.getElementById('adminName').value = '';
        document.getElementById('adminPassword').value = '';
        document.getElementById('loginMessage').style.display = 'none';
    };

    loginForm.addEventListener('submit', handleLogin);

    function initIconPicker() {
        const icons = [
            '👕','👖','👟','🧥','🧢','🕶️','⌚','💍','💎','👜','🎨','✨','🔥','🌟','👑','🧣','🏃','⛓️','🧸','📦'
        ];
        const picker = document.getElementById('iconPicker');
        if (!picker) return;

        picker.innerHTML = '';
        icons.forEach(icon => {
            const div = document.createElement('div');
            div.className = 'icon-option';
            div.textContent = icon;
            div.addEventListener('click', () => {
                document.querySelectorAll('#iconPicker .icon-option').forEach(el => el.classList.remove('selected'));
                div.classList.add('selected');
                document.getElementById('productIcon').value = icon;
            });
            picker.appendChild(div);
        });
    }

    document.getElementById('addProductForm')?.addEventListener('submit', e => {
        e.preventDefault();
        const name = document.getElementById('productName').value.trim();
        const price = parseFloat(document.getElementById('productPrice').value);
        const category = document.getElementById('productCategory').value;
        const icon = document.getElementById('productIcon').value.trim() || '📦';
        const desc = document.getElementById('productDescription').value.trim();

        if (!name || isNaN(price) || price <= 0 || !category || !desc) {
            showMessage('addMessage', 'Please fill all required fields correctly', 'error');
            return;
        }

        const newProduct = {
            id: Date.now(),
            name,
            price,
            category,
            icon,
            image: icon,
            description: desc
        };

        products.push(newProduct);
        saveData();
        showMessage('addMessage', 'Product added successfully!', 'success');
        e.target.reset();
        document.querySelectorAll('#iconPicker .icon-option').forEach(el => el.classList.remove('selected'));
    });

    function loadProductsTable() {
        const tbody = document.getElementById('productsBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="table-empty">No products added yet</td></tr>';
            return;
        }

        products.forEach(p => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="product-icon">${p.icon}</td>
                <td>${p.name}</td>
                <td>$${p.price.toFixed(2)}</td>
                <td>${p.category}</td>
                <td title="${p.description.replace(/"/g, '&quot;')}">
                    ${p.description.substring(0, 60)}${p.description.length > 60 ? '...' : ''}
                </td>
                <td></td>
            `;

            const actionsCell = tr.querySelector('td:last-child');
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit-btn';
            editBtn.type = 'button';
            editBtn.textContent = 'Edit';
            editBtn.setAttribute('data-action', 'edit');
            editBtn.setAttribute('data-id', p.id);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete-btn';
            deleteBtn.type = 'button';
            deleteBtn.textContent = 'Delete';
            deleteBtn.setAttribute('data-action', 'delete');
            deleteBtn.setAttribute('data-id', p.id);

            actionsCell.appendChild(editBtn);
            actionsCell.appendChild(deleteBtn);
            tbody.appendChild(tr);
        });
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');

            if (btn.dataset.tab === 'manage') {
                loadProductsTable();
            }
        });
    });

    const openEdit = function(id) {
        const product = products.find(p => p.id === id);
        if (!product) return;

        document.getElementById('editId').value = product.id;
        document.getElementById('editName').value = product.name;
        document.getElementById('editPrice').value = product.price;
        document.getElementById('editCategory').value = product.category;
        document.getElementById('editIcon').value = product.icon;
        document.getElementById('editDescription').value = product.description;

        document.getElementById('editModal').classList.add('active');
    };

    const closeModal = function() {
        document.getElementById('editModal').classList.remove('active');
    };

    document.getElementById('editForm')?.addEventListener('submit', e => {
        e.preventDefault();
        const id = Number(document.getElementById('editId').value);
        const product = products.find(p => p.id === id);
        if (!product) return;

        product.name = document.getElementById('editName').value.trim();
        product.price = parseFloat(document.getElementById('editPrice').value);
        product.category = document.getElementById('editCategory').value;
        const updatedIcon = document.getElementById('editIcon').value.trim() || '📦';
        product.icon = updatedIcon;
        product.image = updatedIcon;
        product.description = document.getElementById('editDescription').value.trim();

        saveData();
        closeModal();
        loadProductsTable();
        showMessage('manageMessage', 'Product updated successfully', 'success');
    });

    const deleteProduct = function(id) {
        if (!confirm('Delete this product permanently?')) return;

        products = products.filter(p => p.id !== id);
        saveData();
        loadProductsTable();
        showMessage('manageMessage', 'Product deleted successfully', 'success');
    };

    const resetProducts = function() {
        if (!confirm('Reset all products to the default list? This will overwrite current products.')) return;

        products = JSON.parse(JSON.stringify(adminDefaultProducts));
        saveData();
        loadProductsTable();
        showMessage('manageMessage', 'Products reset to defaults', 'success');
    };

    document.querySelectorAll('[data-action="reset-products"]').forEach(btn => {
        btn.addEventListener('click', resetProducts);
    });

    document.querySelectorAll('[data-action="logout-admin"]').forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });

    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    const productsBody = document.getElementById('productsBody');
    if (productsBody) {
        productsBody.addEventListener('click', (e) => {
            const button = e.target.closest('button[data-action][data-id]');
            if (!button) return;
            const action = button.getAttribute('data-action');
            const id = Number(button.getAttribute('data-id'));
            if (!id) return;

            if (action === 'edit') {
                openEdit(id);
            } else if (action === 'delete') {
                deleteProduct(id);
            }
        });
    }

    loadData();
    initIconPicker();
}

function initAuctionsPage() {
    const grid = document.getElementById('auctions-grid');
    if (!grid) return;

    const auctionItems = [
        {
            id: 101,
            name: 'Vintage Gold Watch',
            image: '⌚',
            currentBid: 450,
            startingBid: 100,
            bids: 12,
            timeRemaining: '2h 30m'
        },
        {
            id: 102,
            name: 'Rare Collectible Coins Set',
            image: '🪙',
            currentBid: 850,
            startingBid: 200,
            bids: 28,
            timeRemaining: '5h 15m'
        },
        {
            id: 103,
            name: 'Antique Silver Mirror',
            image: '🪞',
            currentBid: 320,
            startingBid: 50,
            bids: 8,
            timeRemaining: '1h 45m'
        },
        {
            id: 104,
            name: 'Limited Edition Handbag',
            image: '👜',
            currentBid: 1200,
            startingBid: 300,
            bids: 35,
            timeRemaining: '3h 20m'
        },
        {
            id: 105,
            name: 'Vintage Camera Collection',
            image: '📷',
            currentBid: 680,
            startingBid: 150,
            bids: 18,
            timeRemaining: '4h 10m'
        },
        {
            id: 106,
            name: 'Rare Vinyl Records Bundle',
            image: '🎵',
            currentBid: 520,
            startingBid: 100,
            bids: 22,
            timeRemaining: '6h 45m'
        }
    ];

    function renderAuctions() {
        grid.innerHTML = '';
        auctionItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'auction-item';
            div.innerHTML = `
                <div class="item-image">${item.image}</div>
                <div class="item-content">
                    <h3>${item.name}</h3>
                    <p>👥 ${item.bids} bids</p>
                    <div class="current-bid">Current: $${item.currentBid}</div>
                    <p>Starting: $${item.startingBid}</p>
                    <div class="time-remaining">⏱️ ${item.timeRemaining}</div>
                </div>
            `;

            const bidBtn = document.createElement('button');
            bidBtn.type = 'button';
            bidBtn.className = 'bid-btn';
            bidBtn.textContent = 'Place Bid';
            bidBtn.setAttribute('data-id', item.id);
            div.querySelector('.item-content').appendChild(bidBtn);
            grid.appendChild(div);
        });
    }

    function placeBid(itemId) {
        const item = auctionItems.find(a => a.id === itemId);
        const newBid = prompt(`Enter your bid amount (Current: $${item.currentBid}):`, item.currentBid + 50);
        if (newBid && newBid > item.currentBid) {
            item.currentBid = newBid;
            item.bids++;
            renderAuctions();
            alert('Bid placed successfully! You are the highest bidder.');
        } else if (newBid) {
            alert('Your bid must be higher than the current bid.');
        }
    }

    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('.bid-btn');
        if (!btn) return;
        const id = Number(btn.getAttribute('data-id'));
        if (id) placeBid(id);
    });

    renderAuctions();
}

function initPaintingsPage() {
    const grid = document.getElementById('paintings-grid');
    if (!grid) return;

    const paintings = [
        {
            id: 201,
            title: 'Sunset Over Mountains',
            artist: 'Leonardo Rossi',
            year: 2023,
            price: 2500,
            category: 'landscape',
            image: '🏔️',
            description: 'A breathtaking oil painting capturing the golden hour over majestic mountain peaks.'
        },
        {
            id: 202,
            title: 'Abstract Symphony',
            artist: 'Maria Chen',
            year: 2024,
            price: 1800,
            category: 'abstract',
            image: '🎨',
            description: 'Contemporary abstract piece exploring color and form in harmonious balance.'
        },
        {
            id: 203,
            title: 'Modern Reflections',
            artist: 'James Mitchell',
            year: 2023,
            price: 3200,
            category: 'modern',
            image: '🪞',
            description: 'Mixed media artwork combining traditional techniques with contemporary themes.'
        },
        {
            id: 204,
            title: 'Forest Path',
            artist: 'Elena Rossi',
            year: 2024,
            price: 1950,
            category: 'landscape',
            image: '🌲',
            description: 'Serene landscape painting depicting a winding path through ancient forests.'
        },
        {
            id: 205,
            title: 'Portrait of Grace',
            artist: 'Antonio Moretti',
            year: 2023,
            price: 4500,
            category: 'portrait',
            image: '👤',
            description: 'Stunning portrait capturing the essence and beauty of its subject.'
        },
        {
            id: 206,
            title: 'Urban Geometry',
            artist: 'Sofia Petrov',
            year: 2024,
            price: 2200,
            category: 'modern',
            image: '🏙️',
            description: 'Contemporary interpretation of urban architecture and city life.'
        },
        {
            id: 207,
            title: 'Ocean Waves',
            artist: 'Marco Bellini',
            year: 2023,
            price: 2100,
            category: 'landscape',
            image: '🌊',
            description: 'Dynamic seascape capturing the power and beauty of ocean waves.'
        },
        {
            id: 208,
            title: 'Colorful Dreams',
            artist: 'Yuki Tanaka',
            year: 2024,
            price: 1600,
            category: 'abstract',
            image: '💭',
            description: 'Vibrant abstract composition exploring the realm of imagination.'
        },
        {
            id: 209,
            title: 'Classical Beauty',
            artist: 'Isabella Romano',
            year: 2023,
            price: 3800,
            category: 'portrait',
            image: '🎭',
            description: 'Elegant portrait in classical style with timeless beauty.'
        },
        {
            id: 210,
            title: 'Neon Nights',
            artist: 'David Chen',
            year: 2024,
            price: 2400,
            category: 'modern',
            image: '🌃',
            description: 'Modern digital art piece featuring vibrant neon colors and urban aesthetic.'
        }
    ];

    let currentFilter = 'all';

    function renderPaintings(filter = 'all') {
        grid.innerHTML = '';
        const filtered = filter === 'all' ? paintings : paintings.filter(p => p.category === filter);

        filtered.forEach(painting => {
            const div = document.createElement('div');
            div.className = 'painting-card';
            div.innerHTML = `
                <div class="painting-image">${painting.image}</div>
                <div class="painting-info">
                    <h3>${painting.title}</h3>
                    <div class="artist">by ${painting.artist}</div>
                    <div class="year">${painting.year}</div>
                    <div class="painting-price">$${painting.price}</div>
                    <p class="painting-desc">${painting.description}</p>
                </div>
            `;

            div.addEventListener('click', () => showPaintingDetails(painting));

            const viewBtn = document.createElement('button');
            viewBtn.type = 'button';
            viewBtn.className = 'view-btn';
            viewBtn.textContent = 'View Details';
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showPaintingDetails(painting);
            });
            div.querySelector('.painting-info').appendChild(viewBtn);
            grid.appendChild(div);
        });
    }

    function setActiveFilter(target) {
        document.querySelectorAll('.filters button').forEach(btn => btn.classList.remove('active'));
        if (target) target.classList.add('active');
    }

    function showPaintingDetails(painting) {
        const modal = document.getElementById('paintingModal');
        const modalContent = document.getElementById('modalContent');

        modalContent.innerHTML = `
            <h2>${painting.title}</h2>
            <div class="painting-emoji">${painting.image}</div>
            <p><strong>Artist:</strong> ${painting.artist}</p>
            <p><strong>Year:</strong> ${painting.year}</p>
            <p><strong>Price:</strong> <span class="price-highlight">$${painting.price}</span></p>
            <p><strong>Description:</strong> ${painting.description}</p>
            <button class="view-btn mt-20" id="paintingAddToCart">Add to Cart</button>
        `;

        const addBtn = document.getElementById('paintingAddToCart');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                alert('Added to cart! Price: $' + painting.price);
            });
        }

        modal.style.display = 'block';
    }

    function closePaintingModal() {
        document.getElementById('paintingModal').style.display = 'none';
    }

    document.querySelectorAll('.filters button').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.getAttribute('data-category') || 'all';
            currentFilter = category;
            setActiveFilter(btn);
            renderPaintings(category);
        });
    });

    const modal = document.getElementById('paintingModal');
    const modalClose = document.getElementById('paintingModalClose');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closePaintingModal();
        });
    }
    if (modalClose) {
        modalClose.addEventListener('click', closePaintingModal);
    }

    renderPaintings(currentFilter);
}

function initContactPage() {
    const contactForm = document.getElementById('contactForm');
    if (!contactForm) return;

    contactForm.addEventListener('submit', function(event) {
        event.preventDefault();
        alert('Thank you for your message! We will get back to you soon.');
        event.target.reset();
    });
}

function initOrderConfirmationPage() {
    const orderIdEl = document.getElementById('orderId');
    if (!orderIdEl) return;

    function loadOrderDetails() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const orderId = urlParams.get('orderId') || 'ORDER-' + Date.now();
            const total = localStorage.getItem('checkout-total') || '0.00';
            const customerInfo = JSON.parse(localStorage.getItem('customer-info') || '{}');

            document.getElementById('orderId').textContent = orderId;
            document.getElementById('orderDate').textContent = new Date().toLocaleDateString();
            document.getElementById('orderTotal').textContent = '$' + parseFloat(total).toFixed(2);
            document.getElementById('emailConfirm').textContent = customerInfo.email || 'Check your email';
            document.getElementById('shippingAddress').textContent =
                `${customerInfo.address || 'Your address'}, ${customerInfo.city || ''} ${customerInfo.state || ''} ${customerInfo.zip || ''}`;

            localStorage.removeItem('checkout-items');
            localStorage.removeItem('checkout-total');
        } catch (error) {
            console.error('Error loading order details:', error);
        }
    }

    function downloadReceipt() {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId') || 'ORDER-' + Date.now();
        const receiptContent = `
            threepeakviews.com - ORDER RECEIPT
            ================================
            Order ID: ${orderId}
            Date: ${new Date().toLocaleString()}

            Thank you for your purchase!

            To download your full receipt, please log in to your account
            or check your email for the detailed receipt.

            Questions? Contact: support@threepeakviews.com
        `;

        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(receiptContent));
        element.setAttribute('download', `receipt-${orderId}.txt`);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    const downloadBtn = document.getElementById('downloadReceiptBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadReceipt);
    }

    loadOrderDetails();
}

function initCheckoutSecurePage() {
    const checkoutForm = document.getElementById('checkout-form');
    if (!checkoutForm) return;

    const backBtn = document.getElementById('checkoutSecureBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'shop.html';
        });
    }

    const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.API_URL)
        ? process.env.API_URL
        : 'http://localhost:3000/api';

    let stripe = null;
    let elements = null;
    let cardElement = null;
    let currentPaymentMethod = 'stripe';

    async function initializeStripe() {
        try {
            const response = await fetch(`${API_BASE_URL}/config/stripe`);
            const { publishableKey } = await response.json();

            stripe = Stripe(publishableKey);
            elements = stripe.elements();
            cardElement = elements.create('card');
            cardElement.mount('#card-element');

            cardElement.addEventListener('change', function(event) {
                const displayError = document.getElementById('card-errors');
                if (event.error) {
                    displayError.textContent = event.error.message;
                } else {
                    displayError.textContent = '';
                }
            });
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
            showAlert('Failed to initialize payment system', 'error');
        }
    }

    function showAlert(message, type = 'error') {
        const container = document.getElementById('alert-container');
        const alert = document.createElement('div');
        alert.className = `alert ${type}`;
        alert.textContent = message;
        container.innerHTML = '';
        container.appendChild(alert);

        if (type === 'success') {
            setTimeout(() => alert.remove(), 5000);
        }
    }

    function showLoading(show = true) {
        const spinner = document.getElementById('loadingSpinner');
        spinner.style.display = show ? 'block' : 'none';
    }

    function loadOrderSummary() {
        const items = JSON.parse(localStorage.getItem('checkout-items') || '[]');
        const total = parseFloat(localStorage.getItem('checkout-total') || '0');

        const itemsList = document.getElementById('items-list');
        itemsList.innerHTML = '';

        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'order-item';
            itemDiv.innerHTML = `
                <div class="item-name">
                    ${item.name}<br>
                    <small>Qty: ${item.quantity}</small>
                </div>
                <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            `;
            itemsList.appendChild(itemDiv);
        });

        document.getElementById('total-amount').textContent = total.toFixed(2);
    }

    document.querySelectorAll('.payment-method-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const method = this.getAttribute('data-method');
            currentPaymentMethod = method;

            document.querySelectorAll('.payment-method-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            document.getElementById('stripe-section').classList.remove('active');
            document.getElementById('paypal-section').classList.remove('active');
            document.getElementById(`${method}-section`).classList.add('active');
        });
    });

    checkoutForm.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (currentPaymentMethod === 'stripe') {
            await processStripePayment();
        } else {
            await processPayPalPayment();
        }
    });

    async function processStripePayment() {
        showLoading(true);
        const submitBtn = document.getElementById('submit-btn');
        submitBtn.disabled = true;

        try {
            const { fullName, email, phone, address, city, state, zip, country } = getFormData();
            const total = parseFloat(localStorage.getItem('checkout-total') || '0');
            const items = JSON.parse(localStorage.getItem('checkout-items') || '[]');

            const intentResponse = await fetch(`${API_BASE_URL}/payments/stripe/create-intent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: total,
                    currency: 'usd',
                    orderId: `ORDER-${Date.now()}`,
                    customerEmail: email,
                    description: `Order from ${fullName}`,
                }),
            });

            if (!intentResponse.ok) throw new Error('Failed to create payment intent');
            const { clientSecret } = await intentResponse.json();

            const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: { name: fullName, email, address: { line1: address, city, state, postal_code: zip, country } },
                },
            });

            if (error) {
                showAlert(error.message, 'error');
            } else if (paymentIntent && paymentIntent.status === 'succeeded') {
                const orderResponse = await fetch(`${API_BASE_URL}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        items,
                        total,
                        customer: { fullName, email, phone, address: { address, city, state, zip, country } },
                        paymentMethod: 'stripe',
                        paymentIntentId: paymentIntent.id,
                    }),
                });

                if (orderResponse.ok) {
                    const order = await orderResponse.json();
                    localStorage.removeItem('checkout-items');
                    localStorage.removeItem('checkout-total');

                    showAlert('✓ Payment successful! Your order has been confirmed.', 'success');
                    setTimeout(() => {
                        window.location.href = `order-confirmation.html?orderId=${order.orderId}`;
                    }, 2000);
                } else {
                    throw new Error('Failed to create order');
                }
            }
        } catch (error) {
            console.error('Payment error:', error);
            showAlert('Payment failed: ' + error.message, 'error');
        } finally {
            showLoading(false);
            submitBtn.disabled = false;
        }
    }

    async function processPayPalPayment() {
        showLoading(true);

        try {
            const { fullName, email } = getFormData();
            const total = parseFloat(localStorage.getItem('checkout-total') || '0');
            const items = JSON.parse(localStorage.getItem('checkout-items') || '[]');

            const paymentResponse = await fetch(`${API_BASE_URL}/payments/paypal/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: total,
                    orderId: `ORDER-${Date.now()}`,
                    customerEmail: email,
                    items: items.map(item => ({
                        name: item.name,
                        sku: item.id,
                        price: item.price.toFixed(2),
                        quantity: item.quantity,
                        currency: 'USD',
                    })),
                    returnUrl: `${window.location.origin}/order-confirmation.html`,
                    cancelUrl: `${window.location.origin}/checkout.html`,
                }),
            });

            if (!paymentResponse.ok) throw new Error('Failed to create PayPal payment');
            const { approvalUrl } = await paymentResponse.json();

            window.location.href = approvalUrl;
        } catch (error) {
            console.error('PayPal error:', error);
            showAlert('PayPal payment failed: ' + error.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    function getFormData() {
        return {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zip: document.getElementById('zip').value,
            country: document.getElementById('country').value,
        };
    }

    function displayCheckoutUserStatus() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const userStatus = document.getElementById('userStatus');

        if (currentUser && !currentUser.isGuest) {
            userStatus.style.display = 'block';
            document.getElementById('userEmail').textContent = currentUser.email;

            document.getElementById('fullName').value = (currentUser.firstName || '') + ' ' + (currentUser.lastName || '');
            document.getElementById('email').value = currentUser.email;
            document.getElementById('phone').value = currentUser.phone || '';
            document.getElementById('country').value = currentUser.country || '';
        } else {
            userStatus.style.display = 'none';
        }
    }

    const logout = function() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('currentUser');
            window.location.href = 'account.html';
        }
    };

    const logoutLink = document.getElementById('checkoutLogout');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }

    loadOrderSummary();
    initializeStripe();
    displayCheckoutUserStatus();
}

function initPasswordResetPage() {
    const resetForm = document.getElementById('resetForm');
    if (!resetForm) return;

    resetForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const emailInput = document.getElementById('resetEmail');
        const email = emailInput.value.trim();

        if (!email) {
            alert('Please enter your email address.');
            emailInput.focus();
            return;
        }

        if (!email.includes('@') || !email.includes('.')) {
            alert('Please enter a valid email address.');
            emailInput.focus();
            return;
        }

        alert('If this were a live system, a password reset link would be sent to: ' + email);
    });
}

function initSmokeTestPage() {
    const checklist = document.getElementById('smokeChecklist');
    if (!checklist) return;

    const STORAGE_KEY = 'smoke-test-checklist';
    let state = {};

    try {
        state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch (e) {
        state = {};
    }

    checklist.querySelectorAll('input[type="checkbox"][data-key]').forEach(box => {
        const key = box.getAttribute('data-key');
        if (key && state[key]) {
            box.checked = true;
        }

        box.addEventListener('change', () => {
            const updateKey = box.getAttribute('data-key');
            if (!updateKey) return;
            state[updateKey] = box.checked;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        });
    });

    const resetBtn = document.getElementById('resetChecklistBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            state = {};
            localStorage.removeItem(STORAGE_KEY);
            checklist.querySelectorAll('input[type="checkbox"]').forEach(box => {
                box.checked = false;
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    ensureLogoutLink();
    initDropdowns();
    initHomePage();
    initIndexPage();
    initShopPage();
    initAccountPage();
    initSignupPage();
    initAdminPage();
    initAuctionsPage();
    initPaintingsPage();
    initContactPage();
    initOrderConfirmationPage();
    initCheckoutPage();
    initCheckoutSecurePage();
    initPasswordResetPage();
    initSmokeTestPage();
});


