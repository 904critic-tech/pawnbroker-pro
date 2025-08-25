// AdSense Compliant JavaScript for Guided Light App

document.addEventListener('DOMContentLoaded', function() {
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add active state to navigation links on scroll
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-link');
    
    function updateActiveNavLink() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.clientHeight;
            
            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    }
    
    window.addEventListener('scroll', updateActiveNavLink);

    // Add hover effects to cards
    const cards = document.querySelectorAll('.overview-card, .tech-card, .feature-category');
    
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            this.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)';
        });
    });

    // Animate elements on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.overview-card, .tech-card, .feature-category, .section-header');
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add parallax effect to hero section
    const hero = document.querySelector('.hero');
    
    window.addEventListener('scroll', function() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        if (hero) {
            hero.style.transform = `translateY(${rate}px)`;
        }
    });

    // Add loading animation to app mockup
    const phoneFrame = document.querySelector('.phone-frame');
    
    if (phoneFrame) {
        setTimeout(() => {
            phoneFrame.style.opacity = '1';
            phoneFrame.style.transform = 'translateY(0) scale(1)';
        }, 500);
    }

    // Add interactive stats counter
    const stats = document.querySelectorAll('.stat');
    
    function animateStats() {
        stats.forEach(stat => {
            const icon = stat.querySelector('i');
            if (icon) {
                icon.style.animation = 'pulse 2s ease-in-out infinite';
            }
        });
    }
    
    // Trigger stats animation when hero section is visible
    const heroObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateStats();
                heroObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    if (hero) {
        heroObserver.observe(hero);
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0%, 100% {
                transform: scale(1);
                opacity: 0.8;
            }
            50% {
                transform: scale(1.1);
                opacity: 1;
            }
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes float {
            0%, 100% {
                transform: translateY(0px);
            }
            50% {
                transform: translateY(-10px);
            }
        }
        
        .phone-frame {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            transition: opacity 1s ease, transform 1s ease;
        }
        
        .nav-link.active {
            color: #667eea;
        }
        
        .nav-link.active::after {
            width: 100%;
        }
        
        .celestial-bg {
            animation: float 6s ease-in-out infinite;
        }
        
        .verse-card {
            animation: fadeInUp 1s ease-out 0.5s both;
        }
    `;
    document.head.appendChild(style);

    // Add responsive menu toggle for mobile
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.createElement('button');
    navToggle.className = 'nav-toggle';
    navToggle.innerHTML = '<i class="fas fa-bars"></i>';
    navToggle.style.display = 'none';
    
    const navContainer = document.querySelector('.nav-container');
    navContainer.appendChild(navToggle);
    
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        this.innerHTML = navMenu.classList.contains('active') ? 
            '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    });

    // Add mobile menu styles
    const mobileStyles = document.createElement('style');
    mobileStyles.textContent = `
        @media (max-width: 768px) {
            .nav-toggle {
                display: block !important;
                background: none;
                border: none;
                color: #4a5568;
                font-size: 1.25rem;
                cursor: pointer;
                padding: 0.5rem;
            }
            
            .nav-menu {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-top: 1px solid rgba(226, 232, 240, 0.8);
                flex-direction: column;
                padding: 1rem;
                gap: 1rem;
                transform: translateY(-100%);
                opacity: 0;
                transition: all 0.3s ease;
            }
            
            .nav-menu.active {
                transform: translateY(0);
                opacity: 1;
            }
            
            .nav-link {
                padding: 0.5rem 0;
                border-bottom: 1px solid rgba(226, 232, 240, 0.5);
            }
            
            .nav-link:last-child {
                border-bottom: none;
            }
        }
    `;
    document.head.appendChild(mobileStyles);

    // Add scroll-to-top functionality
    const scrollToTopBtn = document.createElement('button');
    scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollToTopBtn.className = 'scroll-to-top';
    scrollToTopBtn.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        cursor: pointer;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    document.body.appendChild(scrollToTopBtn);
    
    scrollToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Show/hide scroll-to-top button
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            scrollToTopBtn.style.opacity = '1';
            scrollToTopBtn.style.visibility = 'visible';
        } else {
            scrollToTopBtn.style.opacity = '0';
            scrollToTopBtn.style.visibility = 'hidden';
        }
    });

    // Add loading state for better UX
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });

    // Add loading styles
    const loadingStyles = document.createElement('style');
    loadingStyles.textContent = `
        body:not(.loaded) {
            overflow: hidden;
        }
        
        body:not(.loaded)::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        body:not(.loaded)::after {
            content: 'Loading...';
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 1.25rem;
            font-weight: 500;
            z-index: 10000;
        }
    `;
    document.head.appendChild(loadingStyles);

    // Add error handling for better reliability
    window.addEventListener('error', function(e) {
        console.warn('Script error occurred:', e.error);
    });

    // Add performance monitoring
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(function() {
                const perfData = performance.getEntriesByType('navigation')[0];
                if (perfData) {
                    console.log('Page load time:', perfData.loadEventEnd - perfData.loadEventStart, 'ms');
                }
            }, 0);
        });
    }

    // Ensure AdSense compliance
    // Prevent any content from interfering with ad spaces
    const adSpaces = document.querySelectorAll('.ad-space, [class*="ad-"], [id*="ad-"]');
    
    adSpaces.forEach(adSpace => {
        // Ensure minimum spacing around ads
        adSpace.style.margin = '2rem 0';
        adSpace.style.minHeight = '90px';
        
        // Prevent content overlap
        const contentElements = adSpace.querySelectorAll('*');
        contentElements.forEach(el => {
            el.style.pointerEvents = 'none';
        });
    });

    // Add accessibility improvements
    const focusableElements = document.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    
    focusableElements.forEach(el => {
        el.addEventListener('focus', function() {
            this.style.outline = '2px solid #667eea';
            this.style.outlineOffset = '2px';
        });
        
        el.addEventListener('blur', function() {
            this.style.outline = 'none';
        });
    });

    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close mobile menu if open
            if (navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                navToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
    });

    console.log('Guided Light App page loaded successfully');
});
