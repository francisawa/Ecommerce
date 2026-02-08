// Product Data
const products = [
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
                li.innerHTML = `<span>${item.name}: $${item.price.toFixed(2)} x${item.quantity}</span><button type="button" class="remove-btn" onclick="cart.removeItem(${item.id})">Remove</button>`;
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
            <button class="add-btn" onclick="addToCart(${product.id})">Add to Cart</button>
        `;
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
    window.location.href = 'checkout.html';
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

// Load Products on Shop Page
window.addEventListener('load', function() {
    if (document.getElementById('products-container')) {
        renderProducts();
    }
    if (document.getElementById('order-summary')) {
        displayOrderSummary();
    }
});


