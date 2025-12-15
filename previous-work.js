import { previousWork, workCategories } from "./data/previous-work.js";

function createCaseCard(item) {
    const card = document.createElement("article");
    card.className = "work-card";
    card.innerHTML = `
        <div class="work-card-top">
            <div class="work-card-meta">
                <span class="status-badge status-${item.category.toLowerCase().replace(/[^a-z]+/g, "-")}">${item.category}</span>
                <p class="eyebrow small">Outcome</p>
                <p class="work-outcome">${item.outcome}</p>
            </div>
            <div class="work-card-heading">
                <h3>${item.title}</h3>
                <div class="work-pill-row">
                    <span class="meta-pill">Problem</span>
                    <span class="meta-pill">Solution</span>
                </div>
            </div>
        </div>
        <div class="work-body">
            <div>
                <p class="label">Problem</p>
                <p class="work-text">${item.problem}</p>
            </div>
            <div>
                <p class="label">Solution</p>
                <p class="work-text">${item.solution}</p>
            </div>
        </div>
        <div class="work-footer">
            ${item.link ? `<a class="btn btn-ghost" href="${item.link}">See details</a>` : `<span class="work-note">Case summary available on request.</span>`}
            <a class="btn btn-primary" href="../index.html#contact">Start something similar</a>
        </div>
    `;
    return card;
}

function renderFilters(activeCategory) {
    const filterBar = document.getElementById("categoryFilters");
    if (!filterBar) return;

    filterBar.innerHTML = "";

    workCategories.forEach(category => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "filter-chip" + (category === activeCategory ? " active" : "");
        button.dataset.category = category;
        button.textContent = category;
        filterBar.appendChild(button);
    });
}

function renderWork(filterCategory = "All") {
    const grid = document.getElementById("workGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const items = previousWork.filter(item => filterCategory === "All" || item.category === filterCategory);

    if (!items.length) {
        const empty = document.createElement("p");
        empty.className = "work-empty";
        empty.textContent = "No work in this category yet. Check back soon.";
        grid.appendChild(empty);
        return;
    }

    items.forEach(item => grid.appendChild(createCaseCard(item)));
}

document.addEventListener("DOMContentLoaded", () => {
    let activeCategory = "All";
    renderFilters(activeCategory);
    renderWork(activeCategory);

    const filterBar = document.getElementById("categoryFilters");
    filterBar?.addEventListener("click", event => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (!target.dataset.category) return;

        activeCategory = target.dataset.category;
        renderFilters(activeCategory);
        renderWork(activeCategory);
    });
});
