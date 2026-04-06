const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'frontend');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const newNav = `<nav class="navbar">
    <div class="nav-left">
        <a href="index.html" class="nav-logo">GB<span>money</span></a>
    </div>
    <div class="nav-center">
        <a href="index.html" class="nav-link">หน้าแรก</a>
        <a href="products.html" class="nav-link">ตลาดสินค้า</a>
        <a href="contact.html" class="nav-link">ติดต่อเรา</a>
    </div>
    <div class="nav-right" id="nav-auth-container">
        <!-- Injected via JS -->
    </div>
</nav>`;

files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Using Regex to replace the entire <nav class="navbar">...</nav>
    const regex = /<nav class="navbar">[\s\S]*?<\/nav>/;
    if (regex.test(content)) {
        content = content.replace(regex, newNav);
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file}`);
    }
});
