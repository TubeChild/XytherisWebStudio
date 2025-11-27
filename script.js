// Run interactions after the DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');
    const contactForm = document.getElementById('contactForm');
    const languageSelect = document.getElementById('languageSelect');
    const LANG_KEY = 'xywebfix-lang';

    const placeholderMap = {
        name: { sv: 'Ditt namn', en: 'Your name' },
        email: { sv: 'Din e-post', en: 'Your email' },
        subject: { sv: 'Ämne', en: 'Subject' },
        message: { sv: 'Ditt meddelande', en: 'Your message' }
    };

    function setPlaceholders(lang) {
        Object.entries(placeholderMap).forEach(([id, values]) => {
            const field = document.getElementById(id);
            if (field) field.placeholder = values[lang] || '';
        });
    }

    function applyLanguage(lang) {
        const selected = lang === 'sv' ? 'sv' : 'en';
        document.documentElement.setAttribute('lang', selected);
        document.body.setAttribute('data-lang', selected);

        document.querySelectorAll('[data-lang]').forEach(el => {
            el.style.display = el.dataset.lang === selected ? '' : 'none';
        });

        setPlaceholders(selected);
        if (languageSelect && languageSelect.value !== selected) {
            languageSelect.value = selected;
        }
        localStorage.setItem(LANG_KEY, selected);
    }

    const initialLang = localStorage.getItem(LANG_KEY) || 'en';
    applyLanguage(initialLang);

    if (languageSelect) {
        languageSelect.addEventListener('change', event => {
            applyLanguage(event.target.value);
        });
    }

    // Toggle mobile nav visibility
    navToggle?.addEventListener('click', () => {
        navMenu?.classList.toggle('active');
    });

    // Smooth-scroll to anchor targets accounting for navbar height
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            navMenu?.classList.remove('active');

            const targetId = this.getAttribute('href');
            if (targetId && targetId.startsWith('#')) {
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    const navHeight = navbar?.offsetHeight || 0;
                    const targetPosition = targetSection.offsetTop - navHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Add subtle shadow to navbar after slight scroll
    window.addEventListener('scroll', () => {
        if (!navbar) return;
        const shadow = window.scrollY > 40
            ? '0 10px 22px rgba(0, 0, 0, 0.35)'
            : '0 8px 18px rgba(0, 0, 0, 0.25)';
        navbar.style.boxShadow = shadow;
    });

    // Basic contact form handler (placeholder alert + reset)
    contactForm?.addEventListener('submit', e => {
        e.preventDefault();

        const name = document.getElementById('name')?.value || '';
        const email = document.getElementById('email')?.value || '';

        alert(`Thank you for your message, ${name}! We'll get back to you soon at ${email}.`);
        contactForm.reset();
        setPlaceholders(localStorage.getItem(LANG_KEY) || 'en');
    });

    // Intersection Observer options for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Card collections and anchors for navigation
    const serviceCards = document.querySelectorAll('.service-card');
    const portfolioCards = document.querySelectorAll('.portfolio-card');
    const contactSection = document.getElementById('contact');

    const portfolioTargets = [
        'portfolio/restaurant.html',
        'portfolio/boutique-store.html',
        'portfolio/services-site.html',
        'portfolio/real-estate.html',
        'portfolio/fitness-studio.html',
        'portfolio/tech-startup.html'
    ];

    // Click service cards to scroll to contact
    serviceCards.forEach(card => {
        card.addEventListener('click', () => {
            if (contactSection) {
                const navHeight = navbar?.offsetHeight || 0;
                const targetPosition = contactSection.offsetTop - navHeight;
                window.scrollTo({ top: targetPosition, behavior: 'smooth' });
            }
        });
    });

    // Click portfolio cards to open their detail pages
    portfolioCards.forEach((card, index) => {
        const target = portfolioTargets[index];
        if (!target) return;
        card.addEventListener('click', () => {
            window.location.href = target;
        });
    });

    // Prime service cards for fade-in animation
    serviceCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Prime portfolio cards for fade-in animation
    portfolioCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});
