const fallbackImageFor = (name) => `https://picsum.photos/seed/${encodeURIComponent(name.toLowerCase())}/300/300`;

// The complete active catalogue: exactly ten products, each with a different direct photo URL.
const catalogProducts = [
  {id:1,name:'Linen Day Shirt',category:'Apparel',price:1299,description:'A breathable, everyday linen shirt with a relaxed tailored fit.',image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&h=600&q=85'},
  {id:2,name:'Canvas Sneakers',category:'Footwear',price:1899,description:'Comfortable canvas sneakers made for daily walks and weekend plans.',image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&h=600&q=85'},
  {id:3,name:'Studio Headphones',category:'Technology',price:2499,description:'Over-ear headphones with rich sound and a clean, modern design.',image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&h=600&q=85'},
  {id:4,name:'Minimal Wristwatch',category:'Accessories',price:3299,description:'A classic wristwatch with a refined face and versatile everyday styling.',image:'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&h=600&q=85'},
  {id:5,name:'Travel Camera',category:'Technology',price:4599,description:'A compact camera for recording memorable trips and everyday details.',image:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&h=600&q=85'},
  {id:6,name:'Oak Desk Lamp',category:'Home & Living',price:1799,description:'A warm desk lamp that brings focused light and calm character to a workspace.',image:'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&h=600&q=85'},
  {id:7,name:'Ceramic Coffee Set',category:'Home & Living',price:1499,description:'A handmade-style ceramic set for slow mornings and shared coffee breaks.',image:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&h=600&q=85'},
  {id:8,name:'Soft Knit Sweater',category:'Apparel',price:1599,description:'A soft-knit sweater designed for comfortable layering through cooler days.',image:'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=600&h=600&q=85'},
  {id:9,name:'Leather Carry Bag',category:'Accessories',price:2199,description:'A practical leather carry bag with space for daily essentials and more.',image:'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&h=600&q=85'},
  {id:10,name:'Daily Journal',category:'Stationery',price:399,description:'A simple journal for plans, reflections, sketches, and daily notes.',image:'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&h=600&q=85'}
];

// Replace browser-stored data; no other products remain active in the application.
state.products = catalogProducts;
state.cart = state.cart.filter(item => catalogProducts.some(product => product.id === item.id));
save();

function productCard(product) {
  const fallback = fallbackImageFor(product.name);
  return `<article class="product"><div class="product-image" style="cursor:pointer" onclick="go('product-${product.id}')"><img src="${product.image}" alt="${product.name}" width="300" height="300" onerror="this.onerror=null;this.src='${fallback}'"></div><div class="product-info"><small>${product.category}</small><h3 style="cursor:pointer" onclick="go('product-${product.id}')">${product.name}</h3><div class="product-row"><span class="price">${money(product.price)}</span><button class="circle" onclick="addCart(${product.id})" aria-label="Add ${product.name}">+</button></div></div></article>`;
}

function productPage(id) {
  const product = state.products.find(item => item.id === id);
  if (!product) return home();
  const fallback = fallbackImageFor(product.name);
  return `<div class="two-col" style="margin:48px auto;max-width:880px;align-items:center"><div class="product-image" style="border-radius:14px"><img src="${product.image}" alt="${product.name}" width="300" height="300" onerror="this.onerror=null;this.src='${fallback}'"></div><div><div class="eyebrow">${product.category}</div><h1 class="page-title" style="margin:10px 0">${product.name}</h1><p class="price" style="font-size:1.35rem">${money(product.price)}</p><p style="color:var(--muted);line-height:1.7">${product.description}</p><button class="btn" onclick="addCart(${product.id})">Add to cart</button><p class="hint">Free delivery on orders above ₹999 · Cash on delivery available</p></div></div>`;
}

function home() {
  return `<section class="hero"><div class="hero-copy"><div class="eyebrow">Curated for everyday</div><h1>Objects to enjoy, every day.</h1><p>Ten thoughtful products for your wardrobe, workspace, and home.</p><button class="btn" onclick="document.getElementById('products').scrollIntoView({behavior:'smooth'})">Shop collection</button></div><div class="hero-art">🛍️</div></section><section id="products"><div class="section-head"><div><span>Our selected collection</span><h2>Fresh arrivals</h2></div><span>10 Products</span></div><div class="grid">${state.products.map(productCard).join('')}</div></section>`;
}

render();

// When the Node server has an Unsplash key, it may replace these initial direct images with cached search results.
async function loadProductImages() {
  try {
    const response = await fetch('/api/product-images', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({products:catalogProducts.map(({id,name})=>({id,name}))}) });
    if (!response.ok) return;
    const { images, usingFallback } = await response.json();
    if (usingFallback) return;
    state.products = state.products.map(product => ({...product, image:images[String(product.id)] || product.image}));
    save(); render();
  } catch { /* Direct product image URLs remain visible when the backend is offline. */ }
}
loadProductImages();
