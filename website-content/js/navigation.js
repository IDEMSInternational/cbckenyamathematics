/**
 * Navigation Menu Functionality
 * Handles mobile menu toggle and active page highlighting
 */

document.addEventListener('DOMContentLoaded', function() {
    initMobileMenu();
    highlightActivePage();
    loadPageContent();
    loadResources();
    loadLessonPlanCatalog();
    initDropdownPositioning();
    initMenuToggles();
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

    if (currentPage.startsWith('resources')) {
        const resourcesLink = document.querySelector('nav a[data-nav="resources"]');
        if (resourcesLink) {
            resourcesLink.classList.add('active');
        }
    }
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
            loadResources();
            loadLessonPlanCatalog();
        })
        .catch(() => {
            container.innerHTML = '<section class="hero"><h2>[Content unavailable]</h2><p>Please refresh the page.</p></section>';
        });
}

/**
 * Load resources from JSON and render into the page
 */
function loadResources() {
    const resourceLists = document.querySelectorAll('[data-resource-list]');

    if (resourceLists.length === 0) {
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
            resourceLists.forEach(resourceList => {
                const typeFilter = resourceList.getAttribute('data-resource-type');
                const filteredResources = filterResourcesByType(resources, typeFilter);
                resourceList.innerHTML = filteredResources.map(renderResourceListCard).join('');
            });
        })
        .catch(() => {
            resourceLists.forEach(resourceList => {
                resourceList.innerHTML = '';
            });
        });
}

function getResourcesDataPath() {
    return 'website-content/data/resources-catalog.json';
}

function getLessonPlansDataPath() {
    return 'website-content/data/lesson-plans-catalog.json';
}

function filterResourcesByType(resources, typeFilter) {
    if (!typeFilter) {
        return resources;
    }

    const normalizedFilter = typeFilter.trim().toLowerCase();
    return resources.filter(resource => {
        const resourceType = (resource.type || '').trim().toLowerCase();
        return resourceType === normalizedFilter;
    });
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
                <a href="${link}" class="btn">Access resource</a>
            </div>
        </div>
    `;
}

function loadLessonPlanCatalog() {
    const chapterContainers = document.querySelectorAll('[data-lesson-plan-chapter]');

    if (chapterContainers.length === 0) {
        return;
    }

    const dataPath = getLessonPlansDataPath();

    fetch(dataPath, { cache: 'no-store' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load lesson plan catalog');
            }
            return response.json();
        })
        .then(data => {
            const chapters = Array.isArray(data.chapters) ? data.chapters : [];
            chapterContainers.forEach(container => {
                const chapterId = container.getAttribute('data-lesson-plan-chapter');
                const chapter = chapters.find(item => item.id === chapterId);

                if (!chapter) {
                    container.innerHTML = '<p>[Lesson plan content coming soon]</p>';
                    return;
                }

                container.innerHTML = renderLessonPlanChapter(chapter);
            });
            
            // Initialize accordion behavior for lessons
            initLessonAccordion();
        })
        .catch(() => {
            chapterContainers.forEach(container => {
                container.innerHTML = '';
            });
        });
}

function initLessonAccordion() {
    const lessonDetails = document.querySelectorAll('.lesson-plan-lesson');
    
    lessonDetails.forEach(detail => {
        detail.addEventListener('toggle', function() {
            if (this.open) {
                // Close all other lessons in the same section
                const section = this.closest('.lesson-plan-section');
                if (section) {
                    section.querySelectorAll('.lesson-plan-lesson').forEach(otherDetail => {
                        if (otherDetail !== this && otherDetail.open) {
                            otherDetail.open = false;
                        }
                    });
                }
            }
        });
    });
}

function renderLessonPlanChapter(chapter) {
    const sections = Array.isArray(chapter.sections) ? chapter.sections : [];

    return `
        <div class="lesson-plan-sections">
            ${sections.map(renderLessonPlanSection).join('')}
        </div>
    `;
}

function renderLessonPlanSection(section) {
    const course = section.course || {};
    const lessons = Array.isArray(course.lessons) ? course.lessons : [];
    const courseTitle = course.title || '';
    const courseLink = course.link || '';
    const courseTitleMarkup = courseTitle
        ? `<div class="lesson-plan-course">
                <h4><strong>Topic Course:</strong> ${courseTitle}</h4>
                ${courseLink && courseLink !== '#' ? `<a href="${courseLink}" class="btn btn-primary btn-access-course" target="_blank" rel="noopener">🎓 Access course</a>` : ''}
           </div>`
        : '';

    return `
        <div class="lesson-plan-section">
            <div class="lesson-plan-section-header">
                <h3>${section.title || '[Section]'}</h3>
                ${courseTitleMarkup}
            </div>
            <div class="lesson-plan-lessons">
                ${lessons.map((lesson, index) => renderLessonPlanLesson(lesson, index === 0)).join('')}
            </div>
        </div>
    `;
}

function renderLessonPlanLesson(lesson, isOpen) {
    const resources = Array.isArray(lesson.resources) ? lesson.resources : [];
    
    if (!resources.length) {
        return `
            <details class="lesson-plan-lesson" ${isOpen ? 'open' : ''}>
                <summary>${lesson.title || '[Lesson]'}</summary>
                <p class="lesson-plan-empty">[Resources coming soon]</p>
            </details>
        `;
    }

    // Group resources by device access
    const withDevices = resources.filter(r => r.deviceAccess === true);
    const withoutDevices = resources.filter(r => r.deviceAccess === false);

    // Build device sections
    const withDevicesSection = withDevices.length ? `
        <div class="lesson-plan-device-section">
            <div class="lesson-plan-device-header">💻 My students have access to devices during class</div>
            <div class="lesson-plan-resources">
                ${withDevices.map(renderLessonPlanResource).join('')}
            </div>
        </div>
    ` : '';

    const withoutDevicesSection = withoutDevices.length ? `
        <div class="lesson-plan-device-section">
            <div class="lesson-plan-device-header">📝 My students will NOT have access to devices during class</div>
            <div class="lesson-plan-resources">
                ${withoutDevices.map(renderLessonPlanResource).join('')}
            </div>
        </div>
    ` : '';

    return `
        <details class="lesson-plan-lesson" ${isOpen ? 'open' : ''}>
            <summary>${lesson.title || '[Lesson]'}</summary>
            <p class="lesson-plan-quick-access">If you're looking for this content on eCampus use the Quick Access link from the course above or navigate to the section for this topic.</p>
            ${withDevicesSection}
            ${withoutDevicesSection}
        </details>
    `;
}

function renderLessonPlanResource(resource) {
    const link = resource.link || '#';
    const label = resource.label || 'Resource';
    const icon = resource.type === 'guide' ? '🧑‍🏫' : '📄';
    return `<a href="${link}" class="btn btn-primary" target="_blank" rel="noopener">${icon} ${label}</a>`;
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

function initDropdownPositioning() {
    const submenuParents = document.querySelectorAll('nav li.has-submenu');

    submenuParents.forEach(parent => {
        const submenu = parent.querySelector(':scope > ul');
        if (!submenu) {
            return;
        }

        const updatePosition = () => adjustSubmenuPosition(submenu);

        parent.addEventListener('mouseenter', () => {
            window.requestAnimationFrame(updatePosition);
        });

        parent.addEventListener('focusin', updatePosition);
        window.addEventListener('resize', updatePosition);
    });
}

function adjustSubmenuPosition(submenu) {
    submenu.classList.remove('submenu-left');

    const rect = submenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
        submenu.classList.add('submenu-left');
    }
}

function initMenuToggles() {
    const toggleLinks = document.querySelectorAll('nav a[data-menu-toggle]');

    toggleLinks.forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();

            const parent = link.closest('li');
            if (!parent) {
                return;
            }

            const submenu = parent.querySelector(':scope > ul');
            if (!submenu) {
                return;
            }

            const isOpen = submenu.style.display === 'flex';
            submenu.style.display = isOpen ? 'none' : 'flex';
            if (!isOpen) {
                adjustSubmenuPosition(submenu);
            }
        });
    });
}
