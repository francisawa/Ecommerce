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

// ============================================================================
// API + Admin session helpers
// ============================================================================

const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_NAME_KEY = 'adminName';

function getAdminToken() {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    return token ? String(token) : '';
}

function setAdminSession(token, name) {
    if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token);
    if (name) localStorage.setItem(ADMIN_NAME_KEY, name);
}

function clearAdminSession() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_NAME_KEY);
}

function logoutAdmin() {
    clearAdminSession();
    if (typeof displayShopUserStatus === 'function') {
        displayShopUserStatus();
    }
    ensureAdminNavLinks();
}

function getAdminName() {
    return localStorage.getItem(ADMIN_NAME_KEY) || 'Admin';
}

function isAdminLoggedIn() {
    return !!getAdminToken();
}

function ensureAdminNavLinks() {
    const adminLoggedIn = isAdminLoggedIn();
    document.querySelectorAll('nav').forEach(nav => {
        const existingManage = nav.querySelector('.admin-manage-link');
        const existingLogout = nav.querySelector('.admin-logout-link');

        if (!adminLoggedIn) {
            if (existingManage) existingManage.remove();
            if (existingLogout) existingLogout.remove();
            return;
        }

        if (!existingManage) {
            const manage = document.createElement('a');
            manage.href = 'admin.html';
            manage.className = 'admin-manage-link';
            manage.textContent = 'Admin Dashboard';
            nav.appendChild(manage);
        }

        if (!existingLogout) {
            const logout = document.createElement('a');
            logout.href = '#';
            logout.className = 'admin-logout-link';
            logout.textContent = 'Admin Logout';
            logout.addEventListener('click', (e) => {
                e.preventDefault();
                logoutAdmin();
            });
            nav.appendChild(logout);
        }
    });
}

async function fetchJson(url, options = {}) {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs || 3500;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const headers = { ...(options.headers || {}) };
        const res = await fetch(url, {
            ...options,
            headers,
            signal: controller.signal,
        });

        if (!res.ok) {
            return { ok: false, status: res.status, data: null };
        }

        const data = await res.json();
        return { ok: true, status: res.status, data };
    } catch {
        return { ok: false, status: 0, data: null };
    } finally {
        clearTimeout(timeout);
    }
}

async function tryLoadProductsFromApi() {
    // Prefer PHP API on static hosting (SiteGround)
    let result = await fetchJson('/api/products.php', { method: 'GET' });
    if (!result.ok) {
        // Node backend fallback
        result = await fetchJson('/api/products', { method: 'GET' });
    }
    if (!result.ok || !result.data || !Array.isArray(result.data.products)) return null;

    return result.data.products.map(p => ({
        ...p,
        image: p.image || p.icon || '📦',
        icon: p.icon || p.image || '📦',
        imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : ''
    }));
}

async function refreshProductsFromApiAndRerender() {
    const apiProducts = await tryLoadProductsFromApi();
    if (!apiProducts) return false;

    products = apiProducts;
    try {
        localStorage.setItem('products', JSON.stringify(products));
    } catch {}

    if (document.getElementById('products-container')) {
        renderProducts(products);
    }

    const featuredGrid = document.getElementById('featured-grid');
    if (featuredGrid) {
        featuredGrid.innerHTML = '';
        initIndexPage();
    }

    return true;
}

// Load products from localStorage, or use default products
let products = [];
function loadProducts() {
    const saved = localStorage.getItem('products');
    if (saved) {
        products = JSON.parse(saved).map(product => {
            const normalized = {
                ...product,
                icon: product.icon || product.image || '📦',
                image: product.image || product.icon || '📦',
                imageUrl: typeof product.imageUrl === 'string' ? product.imageUrl : ''
            };
            return normalized;
        });
    } else {
        products = JSON.parse(JSON.stringify(defaultProducts));
        localStorage.setItem('products', JSON.stringify(products));
    }
}

// Initialize products on script load
loadProducts();

// ============================================================================
// Shop Availability (disable cart/checkout when shop is closed)
// ============================================================================

// Set to true when the shop is open.
const SHOP_ENABLED = false;

function isShopEnabled() {
    return SHOP_ENABLED;
}

function getShopClosedMessage() {
    return 'Shop is currently closed. Checkout is disabled.';
}

const SITE_NOTICE_ENABLED = true;
const SITE_NOTICE_MESSAGE = 'Our website is currently under construction. Please check back soon.';

function injectSiteNotice() {
    if (!SITE_NOTICE_ENABLED) return;
    if (document.getElementById('siteNotice')) return;

    const notice = document.createElement('div');
    notice.id = 'siteNotice';
    notice.className = 'bg-light p-20 rounded-8 my-20';
    notice.innerHTML = `<p class="text-muted"><strong>Notice:</strong> ${SITE_NOTICE_MESSAGE}</p>`;

    const main = document.querySelector('main');
    if (main) {
        main.insertBefore(notice, main.firstChild);
        return;
    }

    const shopControls = document.querySelector('.shop-controls');
    if (shopControls && shopControls.parentElement) {
        shopControls.parentElement.insertBefore(notice, shopControls);
        return;
    }

    const header = document.querySelector('header');
    if (header && header.parentElement) {
        header.parentElement.insertBefore(notice, header.nextSibling);
    }
}

// ============================================================================
// Product media helpers (image upload + emoji fallback)
// ============================================================================

function getProductIcon(product) {
    return (product && (product.icon || product.image)) || '📦';
}

function getProductImageUrl(product) {
    if (!product || typeof product.imageUrl !== 'string') return '';
    const url = product.imageUrl.trim();
    return url.startsWith('data:image/') ? url : '';
}

function renderProductMediaInto(container, product, altText) {
    if (!container) return;
    const url = getProductImageUrl(product);
    container.innerHTML = '';

    if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = altText || product?.name || 'Product';
        img.loading = 'lazy';
        container.appendChild(img);
    } else {
        container.textContent = getProductIcon(product);
    }
}

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
        if (!isShopEnabled()) {
            alert(getShopClosedMessage());
            return;
        }
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
        if (!isShopEnabled()) {
            alert(getShopClosedMessage());
            return;
        }
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
        const countElems = document.querySelectorAll('[data-cart-count]');
        const totalElems = document.querySelectorAll('[data-cart-total]');
        const cartItemsElem = document.getElementById('cart-items');
        const cartSummaryElem = document.querySelector('[data-cart-subtotal]');

        countElems.forEach(elem => elem.textContent = this.getCount());
        totalElems.forEach(elem => elem.textContent = this.getTotal().toFixed(2));

        if (cartItemsElem) {
            cartItemsElem.innerHTML = '';

            if (this.items.length === 0) {
                const empty = document.createElement('li');
                empty.className = 'cart-empty';
                empty.textContent = 'Your cart is empty';
                cartItemsElem.appendChild(empty);
            } else {
                this.items.forEach(item => {
                    const li = document.createElement('li');
                    li.id = 'cart-item-' + item.id;
                    li.className = 'cart-item';

                    const thumb = document.createElement('div');
                    thumb.className = 'cart-thumb';
                    renderProductMediaInto(thumb, item, item.name);

                    const meta = document.createElement('div');
                    meta.className = 'cart-meta';

                    const title = document.createElement('div');
                    title.className = 'cart-title';
                    title.textContent = item.name;

                    const line = document.createElement('div');
                    line.className = 'cart-line';
                    line.innerHTML = `
                        <span class="cart-price">$${item.price.toFixed(2)}</span>
                        <span class="cart-qty">Qty ${item.quantity}</span>
                        <span class="cart-total">$${(item.price * item.quantity).toFixed(2)}</span>
                    `;

                    meta.appendChild(title);
                    meta.appendChild(line);

                    const removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'remove-btn';
                    removeBtn.textContent = 'Remove';
                    removeBtn.addEventListener('click', () => this.removeItem(item.id));

                    li.appendChild(thumb);
                    li.appendChild(meta);
                    li.appendChild(removeBtn);
                    cartItemsElem.appendChild(li);
                });
            }
        }

        if (cartSummaryElem) {
            cartSummaryElem.textContent = this.getTotal().toFixed(2);
        }
    }
}

const cart = new Cart();

function clearCheckoutState() {
    localStorage.removeItem('checkout-items');
    localStorage.removeItem('checkout-total');
}

function clearCartAndCheckout() {
    clearCheckoutState();
    cart.clear();
}

// If the shop is closed, ensure there are no lingering cart/checkout items.
if (!isShopEnabled()) {
    clearCartAndCheckout();
}

// Initialize Cart UI on Page Load
window.addEventListener('load', function() {
    loadProducts();
    cart.updateUI();
});

// Product Listing
function renderProducts(productsToShow = products) {
    const productsDiv = document.getElementById('products-container');
    if (!productsDiv) return;

    const shopEnabled = isShopEnabled();

    productsDiv.innerHTML = '';
    productsToShow.forEach(product => {
        const div = document.createElement('div');
        div.className = 'product';
        div.innerHTML = `
            <div class="product-icon" data-product-media></div>
            <h3>${product.name}</h3>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <p class="product-description">${product.description}</p>
            <input type="number" id="qty-${product.id}" value="1" min="1" max="10" class="qty-input" ${shopEnabled ? '' : 'disabled'}>
        `;

        renderProductMediaInto(div.querySelector('[data-product-media]'), product, product.name);

        const addBtn = document.createElement('button');
        addBtn.type = 'button';
        addBtn.className = 'add-btn';
        addBtn.textContent = shopEnabled ? 'Add to Cart' : 'Shop Closed';
        addBtn.disabled = !shopEnabled;
        if (shopEnabled) {
            addBtn.addEventListener('click', () => addToCart(product.id));
        }
        div.appendChild(addBtn);
        productsDiv.appendChild(div);
    });
}

// Add to Cart Handler
function addToCart(productId) {
    if (!isShopEnabled()) {
        alert(getShopClosedMessage());
        return;
    }
    const product = products.find(p => p.id === productId);
    const qtyElem = document.getElementById('qty-' + productId);
    const qty = qtyElem ? parseInt(qtyElem.value) : 1;
    
    if (product) {
        cart.addItem(product, qty);
        alert(product.name + ' added to cart!');
        if (qtyElem) qtyElem.value = 1;
    }
}

// Checkout
function checkout() {
    if (!isShopEnabled()) {
        alert(getShopClosedMessage());
        clearCartAndCheckout();
        return;
    }
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

    const createdAt = new Date().toISOString();
    const order = {
        id: 'ORDER-' + Date.now(),
        customer: { name, email, address },
        items: JSON.parse(localStorage.getItem('checkout-items') || '[]'),
        total: parseFloat(localStorage.getItem('checkout-total') || '0'),
        date: new Date().toLocaleDateString(),
        createdAt,
        status: 'placed'
    };

    // Save order (in real app, send to server)
    let orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));

    // Best-effort: also send to backend when available (SiteGround PHP or Node)
    fetchJson('/api/orders.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: order.id,
            items: order.items,
            total: order.total,
            customer: order.customer,
            status: order.status
        }),
        timeoutMs: 6000
    }).then(async (res) => {
        if (res.ok) return;
        await fetchJson('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: order.items,
                total: order.total,
                customer: order.customer,
                paymentMethod: 'manual'
            }),
            timeoutMs: 6000
        });
    });

    // Static "database": Upsert client record for reporting
    try {
        const clients = JSON.parse(localStorage.getItem('clients') || '[]');
        const emailKey = String(email || '').trim().toLowerCase();
        if (emailKey) {
            const existing = clients.find(c => String(c.email || '').trim().toLowerCase() === emailKey);
            if (existing) {
                existing.name = name || existing.name;
                existing.address = address || existing.address;
                existing.totalOrders = Number(existing.totalOrders || 0) + 1;
                existing.totalSpend = Number(existing.totalSpend || 0) + Number(order.total || 0);
                existing.lastOrderId = order.id;
                existing.lastOrderAt = createdAt;
                existing.updatedAt = createdAt;
            } else {
                clients.push({
                    id: 'CLIENT-' + Date.now(),
                    name,
                    email,
                    address,
                    totalOrders: 1,
                    totalSpend: Number(order.total || 0),
                    lastOrderId: order.id,
                    lastOrderAt: createdAt,
                    createdAt,
                    updatedAt: createdAt
                });
            }
            localStorage.setItem('clients', JSON.stringify(clients));
        }
    } catch {}

    // Clear checkout
    localStorage.removeItem('checkout-items');
    localStorage.removeItem('checkout-total');
    cart.clear();

    alert('Order placed successfully! Order ID: ' + order.id);
    window.location.href = 'index.html';
}

function initCheckoutPage() {
    if (!isShopEnabled() && document.getElementById('order-summary')) {
        clearCartAndCheckout();
        alert(getShopClosedMessage());
        window.location.href = 'shop.html';
        return;
    }
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
                <div class="product-icon" data-product-media></div>
                <h3>${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
            </div>
        `;

        renderProductMediaInto(card.querySelector('[data-product-media]'), product, product.name);

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

    if (!isShopEnabled()) {
        const headerCart = document.getElementById('header-cart');
        if (headerCart) headerCart.style.display = 'none';

        const cartSummary = document.querySelector('.cart-summary');
        if (cartSummary) cartSummary.style.display = 'none';

        if (checkoutBtn) {
            checkoutBtn.disabled = true;
            checkoutBtn.textContent = 'Shop Closed';
        }
    }

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
        if (isShopEnabled()) {
            checkoutBtn.addEventListener('click', checkout);
        }
    }

    loadProducts();
    renderProducts(products);
    cart.updateUI();
    displayShopUserStatus();

    // If the Node backend is running, prefer the server-side product catalog.
    refreshProductsFromApiAndRerender();
}

function displayShopUserStatus() {
    const userStatusDiv = document.getElementById('user-status');
    if (!userStatusDiv) return;
    const currentUser = localStorage.getItem('currentUser');
    const isGuest = localStorage.getItem('isGuest') === 'true';

    userStatusDiv.innerHTML = '';

    // Admin session takes precedence for shop controls
    if (isAdminLoggedIn()) {
        const label = document.createElement('span');
        label.textContent = `🛡️ Admin: ${getAdminName()}`;

        const manageLink = document.createElement('a');
        manageLink.href = 'admin.html';
        manageLink.textContent = 'Manage Products';

        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.textContent = 'Logout';
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logoutAdmin();
        });

        userStatusDiv.appendChild(label);
        userStatusDiv.appendChild(document.createTextNode(' '));
        userStatusDiv.appendChild(manageLink);
        userStatusDiv.appendChild(document.createTextNode(' '));
        userStatusDiv.appendChild(logoutLink);
        return;
    }

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

    let pendingAddImageUrl = '';
    let pendingEditImageUrl = '';

    function readFileAsDataUrl(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function setImagePreview(container, imageUrl, altText) {
        if (!container) return;
        const url = typeof imageUrl === 'string' ? imageUrl.trim() : '';
        if (!url) {
            container.classList.add('is-hidden');
            container.innerHTML = '';
            return;
        }

        container.classList.remove('is-hidden');
        container.innerHTML = '';
        const img = document.createElement('img');
        img.src = url;
        img.alt = altText || 'Product photo preview';
        img.loading = 'lazy';
        container.appendChild(img);
    }

    function loadData() {
        const saved = localStorage.getItem('products');
        if (saved) {
            try {
                products = JSON.parse(saved).map(p => ({
                    ...p,
                    icon: p.icon || p.image || '📦',
                    imageUrl: typeof p.imageUrl === 'string' ? p.imageUrl : ''
                }));
                return;
            } catch (e) {
                console.error('Invalid products data in localStorage', e);
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

    function safeParseArray(value) {
        try {
            const parsed = JSON.parse(value || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }

    function formatMoney(value) {
        const n = Number(value);
        if (Number.isFinite(n)) return `$${n.toFixed(2)}`;
        return '$0.00';
    }

    function csvEscape(value) {
        const str = String(value ?? '');
        if (/[\n",]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
        return str;
    }

    function downloadCsv(filename, rows) {
        const content = rows.map(r => r.map(csvEscape).join(',')).join('\n');
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function renderEmptyRow(tbody, colspan, text) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = colspan;
        td.className = 'table-empty';
        td.textContent = text;
        tr.appendChild(td);
        tbody.appendChild(tr);
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

    async function tryServerAdminLogin(name, pw) {
        // Prefer PHP API on static hosting (SiteGround)
        let result = await fetchJson('/api/admin_login.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: name, password: pw }),
            timeoutMs: 4500
        });

        if (!result.ok) {
            // Node backend fallback
            result = await fetchJson('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: name, password: pw }),
                timeoutMs: 4500
            });
        }

        if (!result.ok || !result.data || !result.data.token) return null;
        return String(result.data.token);
    }

    function showDashboard() {
        document.getElementById('adminNameDisplay').textContent = currentAdminName;
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        loadProductsTable();
    }

    async function loadDataFromApiIfAvailable() {
        const apiProducts = await tryLoadProductsFromApi();
        if (!apiProducts) return false;
        products = apiProducts.map(p => ({
            ...p,
            icon: p.icon || p.image || '📦',
            image: p.image || p.icon || '📦'
        }));
        return true;
    }

    const handleLogin = async function(e) {
        e.preventDefault();
        const name = document.getElementById('adminName').value.trim();
        const pw = document.getElementById('adminPassword').value.trim();
        const msg = document.getElementById('loginMessage');

        // Prefer server-side admin auth when backend is available
        const serverToken = await tryServerAdminLogin(name, pw);
        if (serverToken) {
            currentAdminName = name || 'Admin';
            setAdminSession(serverToken, currentAdminName);
            await loadDataFromApiIfAvailable();
            showDashboard();
            return;
        }

        // Fallback: local demo auth (static hosting)
        const account = findAdminAccount(name, pw);
        if (!account) {
            msg.textContent = 'Incorrect username or password';
            msg.className = 'message error';
            msg.style.display = 'block';
            document.getElementById('adminPassword').value = '';
            document.getElementById('adminPassword').focus();
            return;
        }

        currentAdminName = account.username || name || 'Admin';
        setAdminSession('local-demo', currentAdminName);
        showDashboard();
    };

    const handleLogout = function() {
        if (!confirm('Are you sure you want to logout?')) return;
        logoutAdmin();
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
            imageUrl: pendingAddImageUrl || '',
            description: desc
        };

        const token = getAdminToken();
        if (token && token !== 'local-demo') {
            // Server-backed create
            fetchJson('/api/products.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newProduct.name,
                    price: newProduct.price,
                    category: newProduct.category,
                    icon: newProduct.icon,
                    imageUrl: newProduct.imageUrl || '',
                    description: newProduct.description
                }),
                timeoutMs: 6000
            }).then(async (result) => {
                if (!result.ok) {
                    // Node backend fallback
                    result = await fetchJson('/api/products', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            name: newProduct.name,
                            price: newProduct.price,
                            category: newProduct.category,
                            icon: newProduct.icon,
                            imageUrl: newProduct.imageUrl || '',
                            description: newProduct.description
                        }),
                        timeoutMs: 6000
                    });
                }
                if (!result.ok || !result.data || !result.data.product) {
                    showMessage('addMessage', 'Could not add product (server).', 'error');
                    return;
                }
                products.push({
                    ...result.data.product,
                    image: result.data.product.icon || '📦'
                });
                showMessage('addMessage', 'Product added successfully!', 'success');
                loadProductsTable();
            });
        } else {
            // Local fallback
            products.push(newProduct);
            saveData();
            showMessage('addMessage', 'Product added successfully!', 'success');
            loadProductsTable();
        }
        e.target.reset();
        document.querySelectorAll('#iconPicker .icon-option').forEach(el => el.classList.remove('selected'));

        pendingAddImageUrl = '';
        const addImageInput = document.getElementById('productImage');
        if (addImageInput) addImageInput.value = '';
        setImagePreview(document.getElementById('productImagePreview'), '', '');
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
                <td class="product-icon" data-product-media></td>
                <td>${p.name}</td>
                <td>$${p.price.toFixed(2)}</td>
                <td>${p.category}</td>
                <td title="${p.description.replace(/"/g, '&quot;')}">
                    ${p.description.substring(0, 60)}${p.description.length > 60 ? '...' : ''}
                </td>
                <td></td>
            `;

            renderProductMediaInto(tr.querySelector('[data-product-media]'), p, p.name);

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

            if (btn.dataset.tab === 'sales') {
                loadSalesTab();
            }
        });
    });

    let lastOrdersForExport = [];

    async function loadOrdersForReporting() {
        const token = getAdminToken();
        if (token && token !== 'local-demo') {
            // Prefer SiteGround PHP API (orders.php GET)
            let result = await fetchJson('/api/orders.php', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                timeoutMs: 6000
            });

            if (!result.ok) {
                // Node backend fallback
                result = await fetchJson('/api/admin/orders', {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeoutMs: 6000
                });
            }
            if (result.ok && result.data && Array.isArray(result.data.orders)) {
                return result.data.orders.map(o => ({
                    id: o.id,
                    createdAt: o.createdAt || '',
                    date: o.createdAt ? new Date(o.createdAt).toLocaleDateString() : '',
                    customer: o.customer || {},
                    total: Number(o.total || 0),
                    status: o.status || 'unknown',
                    paymentMethod: o.paymentMethod || ''
                }));
            }
        }

        const local = safeParseArray(localStorage.getItem('orders'));
        return local.map(o => ({
            id: o.id,
            createdAt: o.createdAt || '',
            date: o.date || (o.createdAt ? new Date(o.createdAt).toLocaleDateString() : ''),
            customer: o.customer || {},
            total: Number(o.total || 0),
            status: o.status || 'placed',
            paymentMethod: o.paymentMethod || ''
        }));
    }

    function buildClientsFromOrders(orders) {
        const map = new Map();
        for (const o of orders) {
            const email = String(o.customer?.email || '').trim();
            if (!email) continue;
            const key = email.toLowerCase();
            const existing = map.get(key) || {
                name: String(o.customer?.name || '').trim(),
                email,
                totalOrders: 0,
                totalSpend: 0,
                lastOrderAt: '',
            };

            existing.totalOrders += 1;
            existing.totalSpend += Number(o.total || 0);
            const when = o.createdAt || '';
            if (when && (!existing.lastOrderAt || when > existing.lastOrderAt)) {
                existing.lastOrderAt = when;
            }
            if (!existing.name) existing.name = String(o.customer?.name || '').trim();
            map.set(key, existing);
        }
        return Array.from(map.values()).sort((a, b) => (b.lastOrderAt || '').localeCompare(a.lastOrderAt || ''));
    }

    function loadClientsForReporting(orders) {
        // Prefer backend clients when logged in (SiteGround PHP)
        const token = getAdminToken();
        if (token && token !== 'local-demo') {
            // Fire-and-forget cached refresh (keeps UI responsive)
            fetchJson('/api/clients.php', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                timeoutMs: 6000
            }).then((result) => {
                if (result.ok && result.data && Array.isArray(result.data.clients)) {
                    try {
                        localStorage.setItem('clients', JSON.stringify(result.data.clients));
                    } catch {}
                }
            });
        }

        const localClients = safeParseArray(localStorage.getItem('clients'))
            .map(c => ({
                name: c.name || '',
                email: c.email || '',
                totalOrders: Number(c.totalOrders ?? 0),
                totalSpend: Number(c.totalSpend ?? 0),
                lastOrderAt: c.lastOrderAt || c.updatedAt || ''
            }))
            .filter(c => c.email);

        // Prefer local clients if present; otherwise derive from orders.
        if (localClients.length) {
            return localClients.sort((a, b) => (b.lastOrderAt || '').localeCompare(a.lastOrderAt || ''));
        }
        return buildClientsFromOrders(orders);
    }

    function loadMessagesForReporting() {
        const token = getAdminToken();
        if (token && token !== 'local-demo') {
            fetchJson('/api/messages.php', {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
                timeoutMs: 6000
            }).then((result) => {
                if (result.ok && result.data && Array.isArray(result.data.messages)) {
                    try {
                        localStorage.setItem('messages', JSON.stringify(result.data.messages));
                    } catch {}
                }
            });
        }

        return safeParseArray(localStorage.getItem('messages'))
            .map(m => ({
                createdAt: m.createdAt || '',
                name: m.name || '',
                email: m.email || '',
                subject: m.subject || '',
                message: m.message || ''
            }));
    }

    async function loadSalesTab() {
        const summary = document.getElementById('salesSummary');
        const ordersBody = document.getElementById('ordersBody');
        const clientsBody = document.getElementById('clientsBody');
        const messagesBody = document.getElementById('messagesBody');
        if (!summary || !ordersBody || !clientsBody || !messagesBody) return;

        ordersBody.innerHTML = '';
        clientsBody.innerHTML = '';
        messagesBody.innerHTML = '';

        const orders = await loadOrdersForReporting();
        const clients = loadClientsForReporting(orders);
        const messages = loadMessagesForReporting();

        lastOrdersForExport = orders;

        const totalOrders = orders.length;
        const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
        summary.textContent = `Total Orders: ${totalOrders} • Revenue: ${formatMoney(revenue)} • Clients: ${clients.length} • Messages: ${messages.length}`;

        if (!orders.length) {
            renderEmptyRow(ordersBody, 5, 'No orders yet');
        } else {
            orders
                .slice()
                .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                .forEach(o => {
                    const tr = document.createElement('tr');

                    const tdId = document.createElement('td');
                    tdId.textContent = o.id || '';

                    const tdDate = document.createElement('td');
                    tdDate.textContent = o.createdAt ? new Date(o.createdAt).toLocaleString() : (o.date || '');

                    const tdCustomer = document.createElement('td');
                    const custName = String(o.customer?.name || '').trim();
                    const custEmail = String(o.customer?.email || '').trim();
                    tdCustomer.textContent = custEmail ? `${custName || 'Customer'} (${custEmail})` : (custName || 'Customer');

                    const tdTotal = document.createElement('td');
                    tdTotal.textContent = formatMoney(o.total);

                    const tdStatus = document.createElement('td');
                    tdStatus.textContent = o.status || '';

                    tr.appendChild(tdId);
                    tr.appendChild(tdDate);
                    tr.appendChild(tdCustomer);
                    tr.appendChild(tdTotal);
                    tr.appendChild(tdStatus);
                    ordersBody.appendChild(tr);
                });
        }

        if (!clients.length) {
            renderEmptyRow(clientsBody, 5, 'No clients yet');
        } else {
            clients.forEach(c => {
                const tr = document.createElement('tr');

                const tdName = document.createElement('td');
                tdName.textContent = c.name || 'Client';

                const tdEmail = document.createElement('td');
                tdEmail.textContent = c.email || '';

                const tdOrders = document.createElement('td');
                tdOrders.textContent = String(Number(c.totalOrders || 0));

                const tdSpend = document.createElement('td');
                tdSpend.textContent = formatMoney(c.totalSpend);

                const tdLast = document.createElement('td');
                tdLast.textContent = c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleString() : '';

                tr.appendChild(tdName);
                tr.appendChild(tdEmail);
                tr.appendChild(tdOrders);
                tr.appendChild(tdSpend);
                tr.appendChild(tdLast);
                clientsBody.appendChild(tr);
            });
        }

        if (!messages.length) {
            renderEmptyRow(messagesBody, 5, 'No messages yet');
        } else {
            messages
                .slice()
                .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                .forEach(m => {
                    const tr = document.createElement('tr');

                    const tdDate = document.createElement('td');
                    tdDate.textContent = m.createdAt ? new Date(m.createdAt).toLocaleString() : '';

                    const tdName = document.createElement('td');
                    tdName.textContent = m.name || '';

                    const tdEmail = document.createElement('td');
                    tdEmail.textContent = m.email || '';

                    const tdSubject = document.createElement('td');
                    tdSubject.textContent = m.subject || '';

                    const tdMessage = document.createElement('td');
                    tdMessage.textContent = m.message || '';

                    tr.appendChild(tdDate);
                    tr.appendChild(tdName);
                    tr.appendChild(tdEmail);
                    tr.appendChild(tdSubject);
                    tr.appendChild(tdMessage);
                    messagesBody.appendChild(tr);
                });
        }
    }

    const exportBtn = document.getElementById('exportOrdersCsvBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            if (!lastOrdersForExport.length) {
                // If the user hits export before opening the tab
                lastOrdersForExport = await loadOrdersForReporting();
            }

            const rows = [
                ['orderId', 'createdAt', 'customerName', 'customerEmail', 'total', 'status', 'paymentMethod'],
                ...lastOrdersForExport.map(o => ([
                    o.id || '',
                    o.createdAt || '',
                    String(o.customer?.name || ''),
                    String(o.customer?.email || ''),
                    Number(o.total || 0).toFixed(2),
                    o.status || '',
                    o.paymentMethod || ''
                ]))
            ];

            downloadCsv('orders.csv', rows);
            showMessage('salesMessage', 'Exported orders.csv', 'success');
        });
    }

    const openEdit = function(id) {
        const product = products.find(p => p.id === id);
        if (!product) return;

        document.getElementById('editId').value = product.id;
        document.getElementById('editName').value = product.name;
        document.getElementById('editPrice').value = product.price;
        document.getElementById('editCategory').value = product.category;
        document.getElementById('editIcon').value = product.icon;
        document.getElementById('editDescription').value = product.description;

        pendingEditImageUrl = '';
        const editImageInput = document.getElementById('editImage');
        if (editImageInput) editImageInput.value = '';
        setImagePreview(document.getElementById('editImagePreview'), product.imageUrl || '', product.name);

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

        if (pendingEditImageUrl) {
            product.imageUrl = pendingEditImageUrl;
        }

        const token = getAdminToken();
        const payload = {
            name: product.name,
            price: product.price,
            category: product.category,
            icon: product.icon,
            imageUrl: product.imageUrl || '',
            description: product.description
        };

        if (token && token !== 'local-demo') {
            fetchJson(`/api/products.php?id=${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
                timeoutMs: 6000
            }).then(async (result) => {
                if (!result.ok) {
                    // Node backend fallback
                    result = await fetchJson(`/api/products/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload),
                        timeoutMs: 6000
                    });
                }
                if (!result.ok) {
                    showMessage('manageMessage', 'Could not update product (server).', 'error');
                    return;
                }
                closeModal();
                loadProductsTable();
                showMessage('manageMessage', 'Product updated successfully', 'success');
            });
            return;
        }

        saveData();
        closeModal();
        loadProductsTable();
        showMessage('manageMessage', 'Product updated successfully', 'success');
    });

    const deleteProduct = function(id) {
        if (!confirm('Delete this product permanently?')) return;

        const token = getAdminToken();
        if (token && token !== 'local-demo') {
            fetchJson(`/api/products.php?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                timeoutMs: 6000
            }).then(async (result) => {
                if (!result.ok) {
                    // Node backend fallback
                    result = await fetchJson(`/api/products/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` },
                        timeoutMs: 6000
                    });
                }
                if (!result.ok) {
                    showMessage('manageMessage', 'Could not delete product (server).', 'error');
                    return;
                }
                products = products.filter(p => p.id !== id);
                loadProductsTable();
                showMessage('manageMessage', 'Product deleted successfully', 'success');
            });
            return;
        }

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

    // If already logged in globally, skip login.
    if (isAdminLoggedIn()) {
        currentAdminName = getAdminName();
        // Try to pull latest products from backend (otherwise fall back to local data)
        loadDataFromApiIfAvailable().then((ok) => {
            if (!ok) loadData();
            showDashboard();
        });
    } else {
        loadData();
    }
    initIconPicker();
    ensureAdminNavLinks();

    const addImageInput = document.getElementById('productImage');
    if (addImageInput) {
        addImageInput.addEventListener('change', async () => {
            const file = addImageInput.files && addImageInput.files[0];
            if (!file) {
                pendingAddImageUrl = '';
                setImagePreview(document.getElementById('productImagePreview'), '', '');
                return;
            }
            try {
                const dataUrl = await readFileAsDataUrl(file);
                pendingAddImageUrl = dataUrl;
                setImagePreview(document.getElementById('productImagePreview'), dataUrl, 'New product photo');
            } catch (err) {
                console.error('Unable to read product image', err);
                pendingAddImageUrl = '';
                setImagePreview(document.getElementById('productImagePreview'), '', '');
                showMessage('addMessage', 'Could not read the selected image file.', 'error');
            }
        });
    }

    const editImageInput = document.getElementById('editImage');
    if (editImageInput) {
        editImageInput.addEventListener('change', async () => {
            const file = editImageInput.files && editImageInput.files[0];
            if (!file) {
                pendingEditImageUrl = '';
                return;
            }
            try {
                const dataUrl = await readFileAsDataUrl(file);
                pendingEditImageUrl = dataUrl;
                setImagePreview(document.getElementById('editImagePreview'), dataUrl, 'Updated product photo');
            } catch (err) {
                console.error('Unable to read edit image', err);
                pendingEditImageUrl = '';
                showMessage('manageMessage', 'Could not read the selected image file.', 'error');
            }
        });
    }
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

        // Static "database": store complaints/messages locally for admin reporting
        try {
            const fd = new FormData(contactForm);
            const entry = {
                id: 'MSG-' + Date.now(),
                name: String(fd.get('name') || '').trim(),
                email: String(fd.get('email') || '').trim(),
                subject: String(fd.get('subject') || '').trim(),
                message: String(fd.get('message') || '').trim(),
                status: 'new',
                createdAt: new Date().toISOString()
            };

            const list = JSON.parse(localStorage.getItem('messages') || '[]');
            list.unshift(entry);
            localStorage.setItem('messages', JSON.stringify(list));

            // Best-effort: also send to backend when available
            fetchJson('/api/messages.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: entry.id,
                    name: entry.name,
                    email: entry.email,
                    subject: entry.subject,
                    message: entry.message
                }),
                timeoutMs: 6000
            });
        } catch {}

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

    if (!isShopEnabled()) {
        clearCartAndCheckout();
        alert(getShopClosedMessage());
        window.location.href = 'shop.html';
        return;
    }

    const backBtn = document.getElementById('checkoutSecureBackBtn');
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = 'shop.html';
        });
    }

    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const API_BASE_URL = isLocalhost
        ? 'http://localhost:3000/api'
        : `${window.location.origin}/api`;

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
            const { email } = getFormData();
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
                    cancelUrl: `${window.location.origin}/checkout-secure.html`,
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
        console.warn('Unable to read smoke test state', e);
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
    injectSiteNotice();
    ensureLogoutLink();
    ensureAdminNavLinks();
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


