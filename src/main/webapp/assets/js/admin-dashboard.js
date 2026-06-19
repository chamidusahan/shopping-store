function getContextPath() {
    const index = window.location.pathname.indexOf('/', 1);
    return index === -1 ? '' : window.location.pathname.substring(0, index);
}

async function parseJsonResponse(response) {
    const rawText = await response.text();
    return rawText.trim() ? JSON.parse(rawText) : {};
}

function signOut() {
    fetch(`${getContextPath()}/api/users/logout`, {
        method: 'GET',
        credentials: 'include'
    }).then((response) => {
        if (response.ok) {
            window.location = 'sign-in.html';
        } else {
            alert('Logout failed.');
        }
    }).catch((error) => {
        alert(error.message);
    });
}

// ----------------------------------------------------
// Dashboard App State & Mock Data
// ----------------------------------------------------
let products = [
    {
        id: 1,
        title: "Classic Oxford Cotton Shirt",
        description: "A timeless classic crafted from premium breathable cotton, featuring a button-down collar and slim-fit cut.",
        category: "Casualwear",
        brand: "Classic Thread",
        gender: "Men",
        sizes: ["S", "M", "L", "XL"],
        images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400"]
    },
    {
        id: 2,
        title: "Elegant Evening Silk Dress",
        description: "A stunning floor-length gown featuring elegant pleats, drape sleeves, and premium silk fabric.",
        category: "Formalwear",
        brand: "Elegance",
        gender: "Women",
        sizes: ["S", "M", "L"],
        images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400"]
    },
    {
        id: 3,
        title: "Active-Fit Running Sneakers",
        description: "Lightweight and cushiony road running shoes designed for high-performance comfort.",
        category: "Footwear",
        brand: "ActiveWear",
        gender: "Unisex",
        sizes: ["M", "L", "XL"],
        images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"]
    }
];

let uploadedImages = [];
let editingProductId = null;
const defaultPlaceholderImage = "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400";

// ----------------------------------------------------
// Tab / View Switching System
// ----------------------------------------------------
function switchView(viewId, event) {
    if (event) {
        event.preventDefault();
    }

    // Hide all view panels
    const views = document.querySelectorAll('.view-panel');
    views.forEach(view => view.classList.remove('active'));

    // Reset active state on all sidebar navigation links
    const navLinks = document.querySelectorAll('.sidebar-menu a');
    navLinks.forEach(link => link.classList.remove('active'));

    // Handle view panels and navigation state mapping
    if (viewId === 'dashboard') {
        document.getElementById('dashboardView').classList.add('active');
        document.getElementById('nav-dashboard').classList.add('active');
    } else if (viewId === 'products') {
        document.getElementById('productsView').classList.add('active');
        document.getElementById('nav-products').classList.add('active');
        renderProductsTable();
    } else if (viewId === 'addProduct') {
        document.getElementById('addProductView').classList.add('active');
        document.getElementById('nav-add-product').classList.add('active');
        if (editingProductId === null) {
            resetAddProductForm();
        }
    } else {
        // Handle placeholders like Orders, Customers, Reports, Analytics, Settings
        const comingSoonView = document.getElementById('comingSoonView');
        const comingSoonTitle = document.getElementById('comingSoonTitle');
        const comingSoonText = document.getElementById('comingSoonText');

        comingSoonView.classList.add('active');

        // Capitalize viewId for header
        const formattedTitle = viewId.charAt(0).toUpperCase() + viewId.slice(1);
        comingSoonTitle.textContent = `${formattedTitle} Management`;
        comingSoonText.textContent = `The backend synchronization and analytics control panel for ${formattedTitle} is currently being implemented. Check back soon!`;

        // Highlight matching nav link if exists
        const matchedNav = document.getElementById(`nav-${viewId}`);
        if (matchedNav) {
            matchedNav.classList.add('active');
        }
    }
}

// ----------------------------------------------------
// Toast Notification Utility
// ----------------------------------------------------
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    
    let iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-triangle-exclamation';
    if (type === 'info') iconClass = 'fa-circle-info';

    toast.innerHTML = `
        <i class="fas ${iconClass}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Fade and slide in
    setTimeout(() => {
        toast.classList.add('show');
    }, 50);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// ----------------------------------------------------
// Product Listing and Filtering Logic
// ----------------------------------------------------
function renderProductsTable(filteredProducts = products) {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (filteredProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--muted);">
                    <i class="fas fa-box-open" style="font-size: 24px; margin-bottom: 12px; display: block;"></i>
                    No products found matching the criteria.
                </td>
            </tr>
        `;
        return;
    }

    filteredProducts.forEach(prod => {
        const imgUrl = prod.images && prod.images.length > 0 ? prod.images[0] : defaultPlaceholderImage;
        const sizeCapsules = prod.sizes.map(size => `<span class="size-badge">${size}</span>`).join('');
        const genderClass = prod.gender ? prod.gender.toLowerCase() : 'unisex';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="product-media">
                    <img src="${imgUrl}" class="product-img" alt="${prod.title}" onerror="this.src='${defaultPlaceholderImage}'">
                    <div>
                        <h4 class="product-title-cell">${prod.title}</h4>
                        <p class="product-desc-cell">${prod.description}</p>
                    </div>
                </div>
            </td>
            <td><span class="badge badge-category">${prod.category}</span></td>
            <td><span class="badge badge-brand">${prod.brand}</span></td>
            <td><span class="badge badge-gender ${genderClass}">${prod.gender}</span></td>
            <td>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                    ${sizeCapsules || '<span style="color: var(--muted); font-size: 12px;">No sizes</span>'}
                </div>
            </td>
            <td>
                <div class="action-btns" style="justify-content: flex-end;">
                    <button class="action-btn edit" title="Edit Product" onclick="editProduct(${prod.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" title="Delete Product" onclick="deleteProduct(${prod.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterProductsTable() {
    const searchVal = document.getElementById('productSearchInput').value.toLowerCase().trim();
    const catVal = document.getElementById('filterCategory').value;
    const brandVal = document.getElementById('filterBrand').value;
    const genVal = document.getElementById('filterGender').value;

    const filtered = products.filter(prod => {
        const matchesSearch = prod.title.toLowerCase().includes(searchVal) || 
                              prod.description.toLowerCase().includes(searchVal);
        const matchesCategory = catVal === "" || prod.category === catVal;
        const matchesBrand = brandVal === "" || prod.brand === brandVal;
        const matchesGender = genVal === "" || prod.gender === genVal;

        return matchesSearch && matchesCategory && matchesBrand && matchesGender;
    });

    renderProductsTable(filtered);
}

// ----------------------------------------------------
// Add & Edit Product Form Handling
// ----------------------------------------------------
function addImageUrl() {
    const input = document.getElementById('imageInput');
    if (!input) return;

    const url = input.value.trim();
    if (!url) {
        showToast("Please enter a valid image URL", "error");
        return;
    }

    if (uploadedImages.length >= 4) {
        showToast("Maximum of 4 images allowed per product", "error");
        return;
    }

    uploadedImages.push(url);
    input.value = '';
    updateImagePreviews();
    showToast("Image added to previews list", "info");
}

function updateImagePreviews() {
    const grid = document.getElementById('imagePreviewsGrid');
    if (!grid) return;

    // Reset grid
    grid.innerHTML = '';

    // Render slots (exactly 4 slots)
    for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div');
        
        if (i < uploadedImages.length) {
            slot.className = 'image-preview-slot';
            slot.innerHTML = `
                <img src="${uploadedImages[i]}" alt="Preview ${i + 1}" onerror="this.src='${defaultPlaceholderImage}'">
                <button type="button" class="remove-img-btn" onclick="removeImage(${i})">
                    <i class="fas fa-times"></i>
                </button>
            `;
        } else {
            slot.className = 'image-preview-slot empty-slot';
            slot.id = `slot-${i}`;
            slot.innerHTML = `<i class="fas fa-image"></i>`;
        }
        grid.appendChild(slot);
    }
}

function removeImage(index) {
    uploadedImages.splice(index, 1);
    updateImagePreviews();
}

function resetAddProductForm() {
    editingProductId = null;
    uploadedImages = [];
    
    const form = document.getElementById('addProductForm');
    if (form) {
        form.reset();
        
        // Reset header title
        const headerTitle = document.querySelector('#addProductView h2');
        if (headerTitle) {
            headerTitle.textContent = "Add New Product";
        }
        
        // Reset submit button text
        const saveBtn = document.getElementById('saveProductBtn');
        if (saveBtn) {
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Product';
        }
    }

    // Clear validation states
    const inputs = document.querySelectorAll('.form-control');
    inputs.forEach(input => input.classList.remove('invalid'));

    const errorMsgs = document.querySelectorAll('.error-message');
    errorMsgs.forEach(msg => msg.style.display = 'none');

    // Reset image previews
    updateImagePreviews();
}

function handleFormSubmit(event) {
    event.preventDefault();

    const titleInput = document.getElementById('productTitle');
    const catSelect = document.getElementById('productCategory');
    const brandSelect = document.getElementById('productBrand');
    const descTextarea = document.getElementById('productDescription');

    let isValid = true;

    // Reset errors
    const inputs = [titleInput, catSelect, brandSelect, descTextarea];
    inputs.forEach(inp => inp.classList.remove('invalid'));
    document.querySelectorAll('.error-message').forEach(err => err.style.display = 'none');

    // Title validation
    if (!titleInput.value.trim()) {
        titleInput.classList.add('invalid');
        document.getElementById('error-title').style.display = 'block';
        isValid = false;
    }

    // Category validation
    if (!catSelect.value) {
        catSelect.classList.add('invalid');
        document.getElementById('error-category').style.display = 'block';
        isValid = false;
    }

    // Brand validation
    if (!brandSelect.value) {
        brandSelect.classList.add('invalid');
        document.getElementById('error-brand').style.display = 'block';
        isValid = false;
    }

    // Description validation
    if (!descTextarea.value.trim()) {
        descTextarea.classList.add('invalid');
        document.getElementById('error-description').style.display = 'block';
        isValid = false;
    }

    if (!isValid) {
        showToast("Please fill in all required fields", "error");
        return;
    }

    // Gather gender
    const genderInput = document.querySelector('input[name="productGender"]:checked');
    const gender = genderInput ? genderInput.value : 'Unisex';

    // Gather sizes
    const sizeCheckboxes = document.querySelectorAll('.chip-checkbox:checked');
    const sizes = Array.from(sizeCheckboxes).map(cb => cb.value);

    // Save product
    if (editingProductId !== null) {
        // Edit existing
        const index = products.findIndex(p => p.id === editingProductId);
        if (index !== -1) {
            products[index] = {
                id: editingProductId,
                title: titleInput.value.trim(),
                description: descTextarea.value.trim(),
                category: catSelect.value,
                brand: brandSelect.value,
                gender: gender,
                sizes: sizes,
                images: uploadedImages.length > 0 ? [...uploadedImages] : [defaultPlaceholderImage]
            };
            showToast("Product updated successfully", "success");
        }
    } else {
        // Create new
        const newProduct = {
            id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
            title: titleInput.value.trim(),
            description: descTextarea.value.trim(),
            category: catSelect.value,
            brand: brandSelect.value,
            gender: gender,
            sizes: sizes,
            images: uploadedImages.length > 0 ? [...uploadedImages] : [defaultPlaceholderImage]
        };
        products.push(newProduct);
        showToast("New product added successfully", "success");
    }

    // Reset and return
    resetAddProductForm();
    switchView('products');
}

function editProduct(id) {
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    editingProductId = id;

    // Change form labels/titles
    const headerTitle = document.querySelector('#addProductView h2');
    if (headerTitle) {
        headerTitle.textContent = "Edit Product Details";
    }

    const saveBtn = document.getElementById('saveProductBtn');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Update Product';
    }

    // Switch view first to render the form container
    switchView('addProduct');

    // Fill out text fields
    document.getElementById('productTitle').value = prod.title;
    document.getElementById('productCategory').value = prod.category;
    document.getElementById('productBrand').value = prod.brand;
    document.getElementById('productDescription').value = prod.description;

    // Fill gender radio
    const genderRadios = document.querySelectorAll('input[name="productGender"]');
    genderRadios.forEach(radio => {
        radio.checked = (radio.value === prod.gender);
    });

    // Fill size checkboxes
    const sizeCheckboxes = document.querySelectorAll('.chip-checkbox');
    sizeCheckboxes.forEach(cb => {
        cb.checked = prod.sizes.includes(cb.value);
    });

    // Populate images
    uploadedImages = [...prod.images];
    updateImagePreviews();
}

function deleteProduct(id) {
    const prod = products.find(p => p.id === id);
    if (!prod) return;

    const confirmMsg = `Are you sure you want to delete product "${prod.title}"? This action cannot be undone.`;
    if (confirm(confirmMsg)) {
        products = products.filter(p => p.id !== id);
        renderProductsTable();
        showToast("Product deleted successfully", "success");
    }
}

// ----------------------------------------------------
// Authentication/Identity Hook
// ----------------------------------------------------
async function loadAdminProfile() {
    try {
        const response = await fetch(`${getContextPath()}/api/users/check-auth`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            window.location = 'sign-in.html';
            return;
        }

        const data = await parseJsonResponse(response);

        if (!data.authenticated || !data.user) {
            window.location = 'sign-in.html';
            return;
        }

        const userRole = String(data.user.role || '').trim().toUpperCase();

        if (userRole !== 'ADMIN') {
            window.location = 'index.html';
            return;
        }

        const fullName = data.user.fullName || [data.user.firstName, data.user.lastName].filter(Boolean).join(' ');
        const identity = document.getElementById('adminIdentity');
        if (identity) {
            identity.textContent = `${fullName || 'Admin'} · ${data.user.email || 'No email available'}`;
        }
    } catch (error) {
        window.location = 'sign-in.html';
    }
}

// Initialize on page load
loadAdminProfile();
renderProductsTable();
updateImagePreviews();