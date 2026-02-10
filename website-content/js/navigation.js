/**
 * Navigation Menu Functionality
 * Handles mobile menu toggle and active page highlighting
 */

document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    highlightActivePage();
    loadPageContent();
    loadResources();
});

/**
 * Initialize mobile menu toggle functionality
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            const isClickInsideNav = nav.contains(event.target);
            const isClickOnToggle = menuToggle.contains(event.target);
            
            if (!isClickInsideNav && !isClickOnToggle && nav.classList.contains('active')) {
                nav.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
        
        // Close menu when window is resized to desktop size
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && nav.classList.contains('active')) {
                nav.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
    }
}

/**
 * Highlight the active page in navigation
 */
function highlightActivePage() {
    const params = new URLSearchParams(window.location.search);
    const currentPage = params.get('page') || 'home';
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (!linkHref) {
            return;
        }

        if (currentPage === 'home' && linkHref === 'index.html') {
            link.classList.add('active');
            return;
        }

        if (linkHref.includes(`page=${currentPage}`)) {
            link.classList.add('active');
        }
    });
}

/**
 * Load page content into the main container on index.html
 */
function loadPageContent() {
    const container = document.getElementById('page-content');
    if (!container) {
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const page = params.get('page') || container.getAttribute('data-page');
    if (!page) {
        return;
    }

    const pagePath = `website-content/pages/${page}.html`;

    fetch(pagePath, { cache: 'no-store' })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${pagePath}`);
            }
            return response.text();
        })
        .then(html => {
            container.innerHTML = html;
            initCarousels();
            loadResources();
        })
        .catch(() => {
            container.innerHTML = '<section class="hero"><h2>[Content unavailable]</h2><p>Please refresh the page.</p></section>';
        });
}

/**
 * Load resources from JSON and render into the page
 */
function loadResources() {
    const carouselTrack = document.querySelector('[data-resource-carousel]');
    const resourceList = document.querySelector('[data-resource-list]');

    if (!carouselTrack && !resourceList) {
        return;
    }

    const dataPath = getResourcesDataPath();

    fetch(dataPath, { cache: 'no-store' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load resources');
            }
            return response.json();
        })
        .then(resources => {
            if (carouselTrack) {
                carouselTrack.innerHTML = resources.map(renderResourceCard).join('');
                initCarousels();
            }

            if (resourceList) {
                resourceList.innerHTML = resources.map(renderResourceListCard).join('');
            }
        })
        .catch(() => {
            if (carouselTrack) {
                carouselTrack.innerHTML = '';
            }
            if (resourceList) {
                resourceList.innerHTML = '';
            }
        });
}

function getResourcesDataPath() {
    return 'website-content/data/resources.json';
}

function renderResourceCard(resource) {
    const link = resource.link || '#';
    return `
        <div class="card carousel-card">
            <div class="carousel-icon">${resource.icon || '📘'}</div>
            <h3>${resource.title || '[Resource]'}</h3>
            <p>${resource.shortDescription || ''}</p>
            <a href="${link}" class="btn btn-primary">[Button]</a>
        </div>
    `;
}

function renderResourceListCard(resource) {
    const link = resource.link || '#';
    return `
        <div class="card resource-card">
            <div class="resource-icon">${resource.icon || '📘'}</div>
            <div class="resource-body">
                <h4>${resource.title || '[Resource]'}</h4>
                <p>${resource.longDescription || ''}</p>
            </div>
            <div class="resource-cta">
                <a href="${link}" class="btn">[Link]</a>
            </div>
        </div>
    `;
}

/**
 * Initialize simple horizontal carousels
 */
function initCarousels() {
    const carousels = document.querySelectorAll('[data-carousel]');

    carousels.forEach(carousel => {
        const track = carousel.querySelector('.carousel-track');
        const prevBtn = carousel.querySelector('.carousel-btn.prev');
        const nextBtn = carousel.querySelector('.carousel-btn.next');

        if (!track || !prevBtn || !nextBtn) {
            return;
        }

        const updateButtons = () => {
            const maxScroll = track.scrollWidth - track.clientWidth;
            prevBtn.classList.toggle('is-hidden', track.scrollLeft <= 1);
            nextBtn.classList.toggle('is-hidden', track.scrollLeft >= maxScroll - 1);
        };

        const scrollByCard = (direction) => {
            const firstCard = track.querySelector('.carousel-card');
            const gap = 18;
            const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 0;
            track.scrollBy({ left: direction * (cardWidth + gap), behavior: 'smooth' });
        };

        prevBtn.addEventListener('click', () => scrollByCard(-1));
        nextBtn.addEventListener('click', () => scrollByCard(1));

        track.addEventListener('scroll', () => {
            window.requestAnimationFrame(updateButtons);
        });

        window.addEventListener('resize', updateButtons);
        updateButtons();
    });
}

/**
 * Smooth scroll to anchor links (if needed)
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}
