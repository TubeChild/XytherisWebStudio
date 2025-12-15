import { products } from "./data/products.js";

const statusClassMap = {
    "In development": "status-dev",
    "Prototype": "status-prototype",
    "Live": "status-live"
};

const statusCopy = {
    "In development": "Actively being built with pilots.",
    "Prototype": "Early concept, perfect for feedback.",
    "Live": "Ready to run today."
};

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.id = `product-${product.slug}`;

    const statusClass = statusClassMap[product.status] || "";
    const detailText = product.detail || "";

    card.innerHTML = `
        <div class="product-card-top">
            <div class="product-card-titles">
                <p class="eyebrow small">#${product.slug}</p>
                <h3>${product.title}</h3>
                <p class="product-description">${product.description}</p>
            </div>
            <div class="product-status">
                <span class="status-badge ${statusClass}">${product.status}</span>
                <p class="status-note">${statusCopy[product.status] || ""}</p>
            </div>
        </div>
        <div class="product-detail" id="product-${product.slug}-detail" hidden>
            <p>${detailText}</p>
        </div>
        <div class="product-actions">
            <button class="btn btn-primary product-toggle" type="button" aria-expanded="false" aria-controls="product-${product.slug}-detail">Learn more</button>
            <a class="btn btn-ghost" href="../index.html#contact" title="Talk to us">Talk to us</a>
        </div>
    `;

    return card;
}

function renderProducts(list) {
    const grid = document.getElementById("productsGrid");
    if (!grid) return;

    grid.innerHTML = "";

    if (!list.length) {
        const empty = document.createElement("p");
        empty.className = "product-empty";
        empty.textContent = "No products to show yet. Check back soon.";
        grid.appendChild(empty);
        return;
    }

    list.forEach(product => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });

    grid.querySelectorAll(".product-toggle").forEach(button => {
        button.addEventListener("click", () => {
            const card = button.closest(".product-card");
            const detail = card?.querySelector(".product-detail");
            if (!card || !detail) return;

            const expanded = card.classList.toggle("expanded");
            detail.hidden = !expanded;
            button.setAttribute("aria-expanded", expanded.toString());
            button.textContent = expanded ? "Hide details" : "Learn more";
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderProducts(products);
});
