// Run all interactions after the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Cache commonly used elements
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navbar = document.querySelector('.navbar');
    const contactForm = document.getElementById('contactForm');

    // Close mobile nav when any nav link is clicked
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // Toggle mobile nav visibility
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
    });

    // Smooth-scroll to anchor targets accounting for navbar height
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');

            const targetId = this.getAttribute('href');
            if (targetId.startsWith('#')) {
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    const navHeight = navbar.offsetHeight;
                    const targetPosition = targetSection.offsetTop - navHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Add shadow to navbar after slight scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        } else {
            navbar.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        }
    });

    // Basic contact form handler (placeholder alert + reset)
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const subject = document.getElementById('subject').value;
        const message = document.getElementById('message').value;

        alert(`Thank you for your message, ${name}! We'll get back to you soon at ${email}.`);

        contactForm.reset();
    });

    // Intersection Observer options for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    // Reveal cards on scroll
    const observer = new IntersectionObserver(function(entries) {
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

    // Map portfolio cards to their detail pages
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
                const navHeight = navbar.offsetHeight;
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
