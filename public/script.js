// Ensure DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Hamburger Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const body = document.body;

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            const isActive = hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
            // Prevent body scrolling when menu is open
            body.style.overflow = isActive ? 'hidden' : '';
            // Update ARIA attributes
            hamburger.setAttribute('aria-expanded', isActive);
        });

        // Dropdown Toggle for Mobile
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            const link = item.querySelector('.nav-link');
            link.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) {
                    e.preventDefault();
                    const isActive = item.classList.contains('active');
                    navItems.forEach(i => i.classList.remove('active'));
                    if (!isActive) {
                        item.classList.add('active');
                        link.setAttribute('aria-expanded', 'true');
                    } else {
                        link.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        });

        // Close Menu When Clicking Outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
                navItems.forEach(item => {
                    item.classList.remove('active');
                    const link = item.querySelector('.nav-link');
                    if (link) link.setAttribute('aria-expanded', 'false');
                });
                body.style.overflow = '';
                hamburger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Create Hover Grid
    function createHoverGrid() {
        const grid = document.getElementById('hoverGrid');
        const heroSection = document.querySelector('.hero');
        if (!grid || !heroSection) return;

        const gridWidth = heroSection.offsetWidth;
        const gridHeight = heroSection.offsetHeight;
        const squareSize = window.innerWidth <= 768 ? 30 : 40;
        const columns = Math.ceil(gridWidth / squareSize);
        const rows = Math.ceil(gridHeight / squareSize);

        grid.innerHTML = '';
        grid.style.gridTemplateColumns = `repeat(${columns}, ${squareSize}px)`;
        grid.style.gridTemplateRows = `repeat(${rows}, ${squareSize}px)`;

        for (let i = 0; i < columns * rows; i++) {
            const square = document.createElement('div');
            square.className = 'grid-square';
            grid.appendChild(square);
        }
    }

    createHoverGrid();
    window.addEventListener('resize', createHoverGrid);

    // Consolidated Floating Particles Function
    function createFloatingParticles(element, particleCount = 6, duration = 1500) {
        if (!element.isConnected) return;
        for (let i = 0; i < particleCount; i++) {
            setTimeout(() => {
                const particle = document.createElement('div');
                particle.style.position = 'absolute';
                const size = Math.random() * 4 + 2;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.background = `rgba(${124 + Math.random() * 44}, ${58 + Math.random() * 27}, 237, ${0.6 + Math.random() * 0.4})`;
                particle.style.borderRadius = '50%';
                particle.style.pointerEvents = 'none';
                particle.style.zIndex = '10';

                const startX = Math.random() * element.offsetWidth;
                const startY = Math.random() * element.offsetHeight;
                const endX = startX + (Math.random() - 0.5) * 80;
                const endY = startY - Math.random() * 80;

                particle.style.left = `${startX}px`;
                particle.style.top = `${startY}px`;

                element.appendChild(particle);

                particle.animate([
                    { transform: 'translate(0, 0) scale(0)', opacity: 0 },
                    { transform: `translate(${(endX - startX) * 0.5}px, ${(endY - startY) * 0.5}px) scale(1)`, opacity: 1, offset: 0.3 },
                    { transform: `translate(${endX - startX}px, ${endY - startY}px) scale(0)`, opacity: 0 }
                ], {
                    duration: duration + Math.random() * 1000,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
                }).onfinish = () => particle.remove();
            }, i * 150);
        }
    }

    // Course Card Interactions
    document.querySelectorAll('.course-card').forEach(card => {
        let timeout;
        let isAnimating = false;

        const handleMouseEnter = () => {
            if (isAnimating) return;
            isAnimating = true;

            clearTimeout(timeout);

            // Animate tech tags
            const techTags = card.querySelectorAll('.tech-tag');
            techTags.forEach((tag, index) => {
                setTimeout(() => {
                    tag.style.transform = 'translateY(-3px) scale(1.05)';
                    tag.style.background = 'rgba(168, 85, 247, 0.4)';
                }, index * 100);
            });

            // Animate stats
            const statNumbers = card.querySelectorAll('.stat-number');
            statNumbers.forEach(stat => {
                const text = stat.textContent.trim();
                const match = text.match(/^(\d+\.?\d*)\D*$/); // Match numbers like "150", "1.5", "150+"
                if (match) {
                    const number = parseFloat(match[1]);
                    let current = 0;
                    const increment = number / 20;
                    const suffix = text.replace(match[1], '');
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= number) {
                            stat.textContent = text;
                            clearInterval(timer);
                        } else {
                            stat.textContent = Math.round(current) + suffix;
                        }
                    }, 50);
                }
            });

            createFloatingParticles(card, 8);
        };

        const handleMouseLeave = () => {
            timeout = setTimeout(() => {
                isAnimating = false;
                const techTags = card.querySelectorAll('.tech-tag');
                techTags.forEach(tag => {
                    tag.style.transform = '';
                    tag.style.background = '';
                });
            }, 200);
            card.style.transform = '';
        };

        const handleMouseMove = (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const rotateY = (x / rect.width) * 20;
            const rotateX = -(y / rect.height) * 20;
            card.style.transform = `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };

        card.addEventListener('mouseenter', handleMouseEnter);
        card.addEventListener('mouseleave', handleMouseLeave);
        card.addEventListener('mousemove', handleMouseMove);

        // Cleanup function
        return () => {
            card.removeEventListener('mouseenter', handleMouseEnter);
            card.removeEventListener('mouseleave', handleMouseLeave);
            card.removeEventListener('mousemove', handleMouseMove);
        };
    });

    // Mentor Card Interactions
    document.querySelectorAll('.mentor-card').forEach(card => {
        let timeout;
        let isAnimating = false;

        const handleMouseEnter = () => {
            if (isAnimating) return;
            isAnimating = true;

            clearTimeout(timeout);

            const socialIcons = card.querySelectorAll('.social-icon');
            socialIcons.forEach((icon, index) => {
                setTimeout(() => {
                    icon.style.transform = 'translateY(-3px) scale(1.1)';
                    icon.style.color = '#a855f7';
                }, index * 100);
            });

            createFloatingParticles(card);
        };

        const handleMouseLeave = () => {
            timeout = setTimeout(() => {
                isAnimating = false;
                const socialIcons = card.querySelectorAll('.social-icon');
                socialIcons.forEach(icon => {
                    icon.style.transform = '';
                    icon.style.color = '';
                });
            }, 200);
            card.style.transform = '';
        };

        const handleMouseMove = (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            const rotateY = (x / rect.width) * 20;
            const rotateX = -(y / rect.height) * 20;
            card.style.transform = `translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        };

        card.addEventListener('mouseenter', handleMouseEnter);
        card.addEventListener('mouseleave', handleMouseLeave);
        card.addEventListener('mousemove', handleMouseMove);

        return () => {
            card.removeEventListener('mouseenter', handleMouseEnter);
            card.removeEventListener('mouseleave', handleMouseLeave);
            card.removeEventListener('mousemove', handleMouseMove);
        };
    });

    // Scroll Animations for Cards
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const animateCards = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cards = entry.target.querySelectorAll('.course-card, .mentor-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                        card.style.transition = 'all 0.6s ease';
                    }, index * 200);
                });
                observer.unobserve(entry.target);
            }
        });
    };

    const cardObserver = new IntersectionObserver(animateCards, observerOptions);

    const coursesGrid = document.querySelector('.courses-grid');
    const mentorsGrid = document.querySelector('.mentors-grid');

    if (coursesGrid) {
        coursesGrid.querySelectorAll('.course-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
        });
        cardObserver.observe(coursesGrid);
    }

    if (mentorsGrid) {
        mentorsGrid.querySelectorAll('.mentor-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
        });
        cardObserver.observe(mentorsGrid);
    }

    // Stats Animation
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                statsObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.stat-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        statsObserver.observe(el);
    });

    // Footer Animation
    const footerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sections = entry.target.querySelectorAll('.footer-section');
                sections.forEach((section, index) => {
                    setTimeout(() => {
                        section.style.opacity = '1';
                        section.style.transform = 'translateY(0)';
                        section.style.transition = 'all 0.6s ease';
                    }, index * 200);
                });
                footerObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const footer = document.querySelector('.footer');
    if (footer) {
        footer.querySelectorAll('.footer-section').forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
        });
        footerObserver.observe(footer);
    }

    // Navbar Scroll Effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 100) {
            navbar.style.background = 'rgba(255, 255, 255, 0.98)';
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = 'none';
        }
    });

    // Ripple Effect for Buttons
    const addRippleEffect = (button) => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.borderRadius = '50%';
            ripple.style.background = 'rgba(255, 255, 255, 0.6)';
            ripple.style.transform = 'scale(0)';
            ripple.style.animation = 'ripple 0.6s linear';
            const rect = button.getBoundingClientRect();
            ripple.style.left = `${e.clientX - rect.left}px`;
            ripple.style.top = `${e.clientY - rect.top}px`;
            button.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);

            // Handle navigation after ripple
            const href = button.getAttribute('href');
            if (href && href.startsWith('#')) {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    };

    document.querySelectorAll('.btn, .view-all-btn, .footer-link[href^="#"]').forEach(addRippleEffect);

    // Newsletter Form Submission
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = e.target.querySelector('.newsletter-input');
            const email = emailInput.value.trim();

            if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert('Thank you for subscribing to Skillshastra!');
                emailInput.value = '';
            } else {
                alert('Please enter a valid email address.');
            }
        });
    }

    // Add Ripple Animation Styles (once)
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});