const API_URL = 'http://localhost:3000/api';
let currentUser = null;

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    updateNavbar();
});


// Toast Notification System
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Authentication
function checkAuthStatus() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
        currentUser = JSON.parse(userStr);
    } else {
        currentUser = null;
    }
}

function updateNavbar() {
    const authContainer = document.getElementById('nav-auth-container');
    if (!authContainer) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartCount = cart.length;

    let html = `
        <a href="cart.html" style="text-decoration:none;">
            <span class="cart">🛒
                <span id="cart-count" style="background:var(--primary); color:white; border-radius:50%; width:18px; height:18px; display:flex; align-items:center; justify-content:center; font-size:10px; position:absolute; top:-8px; right:-12px; font-weight:bold;">${cartCount}</span>
            </span>
        </a>
    `;

    if (currentUser) {
        html += `
            <span class="user">ยินดีต้อนรับ, <span>${currentUser.username}</span></span>
            <button onclick="window.location.href='dashboard.html'" class="btn dashboard">แดชบอร์ด</button>
            <button onclick="logout()" class="btn logout">ออกจากระบบ</button>
        `;
    } else {
        html += `
            <button onclick="window.location.href='login.html'" class="btn">เข้าสู่ระบบ</button>
            <button onclick="window.location.href='register.html'" class="btn dashboard">สมัครสมาชิก</button>
        `;
    }
    
    authContainer.innerHTML = html;
}

// ============== CART FUNCTIONS ==============
function getCart() {
    return JSON.parse(localStorage.getItem('cart') || '[]');
}

function addToCart(product) {
    const cart = getCart();
    if (cart.find(p => p.id === product.id)) {
        showToast('สินค้าอยู่ในตะกร้าแล้ว', 'error');
        return;
    }
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    showToast('เพิ่มลงตะกร้าเรียบร้อย', 'success');
    updateNavbar();
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(p => p.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateNavbar();
}

function clearCart() {
    localStorage.removeItem('cart');
    updateNavbar();
}
// ============================================

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    currentUser = null;
    showToast('ออกจากระบบสำเร็จ', 'success');
    updateNavbar();
    
    // Redirect if on protected page
    if (window.location.pathname.includes('dashboard') || window.location.pathname.includes('admin')) {
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

// API Fetch Helper
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultHeaders = {};
    if (!(options.body instanceof FormData)) {
        defaultHeaders['Content-Type'] = 'application/json';
    }
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Something went wrong');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
