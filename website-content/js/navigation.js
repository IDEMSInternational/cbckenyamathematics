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
    loadLessonPlanChapterButtons();
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
            loadLessonPlanChapterButtons();
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

/**
 * Load lesson plan chapter buttons on home page
 */
function loadLessonPlanChapterButtons() {
    const buttonContainer = document.querySelector('[data-lesson-plan-chapters]');
    
    if (!buttonContainer) {
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
            
            if (chapters.length === 0) {
                buttonContainer.innerHTML = '<p>No chapters available</p>';
                return;
            }

            // Create buttons for each chapter
            const buttonsHTML = chapters.map(chapter => {
                // Map chapter IDs to page names:
                // numbers-algebra → numbers, measurements-geometry → measurements, etc.
                const pageSlug = chapter.id.split('-')[0];
                return `<a href="index.html?page=resources-lesson-plans-${pageSlug}" class="btn btn-primary">${chapter.title}</a>`;
            }).join('');

            buttonContainer.innerHTML = buttonsHTML;
        })
        .catch(() => {
            buttonContainer.innerHTML = '<p>Unable to load chapters</p>';
        });
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
            const baseUrl = data.baseUrl || '';
            const chapters = Array.isArray(data.chapters) ? data.chapters : [];
            
            chapterContainers.forEach(container => {
                const chapterId = container.getAttribute('data-lesson-plan-chapter');
                const chapter = chapters.find(item => item.id === chapterId);

                if (!chapter) {
                    container.innerHTML = '<p>[Lesson plan content coming soon]</p>';
                    return;
                }

                container.innerHTML = renderLessonPlanChapter(chapter, baseUrl);
            });
            
            // Initialize accordion behavior for sections, subsections, and topics
            initSectionAccordion();
            initSubsectionAccordion();
            initTopicAccordion();
        })
        .catch(() => {
            chapterContainers.forEach(container => {
                container.innerHTML = '';
            });
        });
}

function initSectionAccordion() {
    const sectionDetails = document.querySelectorAll('.lesson-plan-section');
    
    sectionDetails.forEach(detail => {
        detail.addEventListener('toggle', function() {
            if (this.open) {
                // Close all other sections on the same page
                sectionDetails.forEach(otherDetail => {
                    if (otherDetail !== this && otherDetail.open) {
                        otherDetail.open = false;
                    }
                });
            }
        });
    });
}

function initSubsectionAccordion() {
    const subsectionDetails = document.querySelectorAll('.lesson-plan-subsection');
    
    subsectionDetails.forEach(detail => {
        detail.addEventListener('toggle', function() {
            if (this.open) {
                // Close all other subsections in the same section
                const section = this.closest('.lesson-plan-section');
                if (section) {
                    section.querySelectorAll('.lesson-plan-subsection').forEach(otherDetail => {
                        if (otherDetail !== this && otherDetail.open) {
                            otherDetail.open = false;
                        }
                    });
                }
            }
        });
    });
}

function initTopicAccordion() {
    const topicDetails = document.querySelectorAll('.lesson-plan-topic');
    
    topicDetails.forEach(detail => {
        detail.addEventListener('toggle', function() {
            if (this.open) {
                // Close all other topics in the same subsection
                const subsection = this.closest('.lesson-plan-subsection');
                if (subsection) {
                    subsection.querySelectorAll('.lesson-plan-topic').forEach(otherDetail => {
                        if (otherDetail !== this && otherDetail.open) {
                            otherDetail.open = false;
                        }
                    });
                }
            }
        });
    });
}

function renderLessonPlanChapter(chapter, baseUrl) {
    const sections = Array.isArray(chapter.sections) ? chapter.sections : [];

    return `
        <div class="lesson-plan-sections">
            ${sections.map(section => renderLessonPlanSection(section, baseUrl)).join('')}
        </div>
    `;
}

function renderLessonPlanSection(section, baseUrl) {
    const subsections = Array.isArray(section.subsections) ? section.subsections : [];
    const learningObjectives = Array.isArray(section.learningObjectives) ? section.learningObjectives : [];
    const course = section.course || {};
    
    const objectivesMarkup = learningObjectives.length > 0
        ? `<div class="lesson-plan-learning-objectives">
                <h4>Learning Objectives:</h4>
                <ul>
                    ${learningObjectives.map(obj => `<li>${obj}</li>`).join('')}
                </ul>
           </div>`
        : '';
    
    const courseMarkup = course.url && course.url !== '#'
        ? `<div class="lesson-plan-course">
                <h4><strong>Topic Course:</strong> ${course.title || section.title}</h4>
                <a href="${course.url}" class="btn btn-primary btn-access-course" target="_blank" rel="noopener">🎓 Access course</a>
           </div>`
        : '';

    return `
        <details class="lesson-plan-section">
            <summary class="lesson-plan-section-header">
                <h3>${section.title || '[Section]'}</h3>
                ${courseMarkup}
            </summary>
            ${objectivesMarkup}
            <div class="lesson-plan-subsections">
                ${subsections.map(subsection => renderLessonPlanSubsection(subsection, section, baseUrl)).join('')}
            </div>
        </details>
    `;
}

function renderLessonPlanSubsection(subsection, section, baseUrl) {
    if (subsection.hasSubtopics) {
        // Subsection has multiple topics
        const topics = Array.isArray(subsection.topics) ? subsection.topics : [];
        
        return `
            <details class="lesson-plan-subsection">
                <summary class="lesson-plan-subsection-header">
                    <h4>${subsection.title || '[Subsection]'}</h4>
                </summary>
                <div class="lesson-plan-topics">
                    ${topics.map(topic => renderLessonPlanTopic(topic, section, baseUrl)).join('')}
                </div>
            </details>
        `;
    } else {
        // Subsection contains direct lesson plan and guide
        return renderLessonPlanTopicDirect(subsection, section, baseUrl);
    }
}

function renderLessonPlanTopic(topic, section, baseUrl) {
    const learningObjectives = section.learningObjectives || [];
    const topicObjectives = Array.isArray(topic.learningObjectiveRefs)
        ? topic.learningObjectiveRefs.map(idx => learningObjectives[idx]).filter(obj => obj)
        : [];
    
    const objectivesMarkup = topicObjectives.length > 0
        ? `<div class="lesson-plan-topic-objectives">
                <p><strong>Learning Objectives:</strong></p>
                <ul>
                    ${topicObjectives.map(obj => `<li>${obj}</li>`).join('')}
                </ul>
           </div>`
        : '';
    
    const lessonPlan = topic.lessonPlan || {};
    const guide = topic.guide || {};
    
    const lessonPlanLink = lessonPlan.exists && lessonPlan.url
        ? `<a href="${lessonPlan.url}" class="btn btn-primary" target="_blank" rel="noopener">📄 Lesson Plan</a>`
        : `<span class="btn btn-secondary btn-disabled">📄 Lesson Plan (Coming Soon)</span>`;
    
    const guideLink = guide.exists && guide.url
        ? `<a href="${guide.url}" class="btn btn-primary" target="_blank" rel="noopener">🧑‍🏫 Step by Step Guide</a>`
        : `<span class="btn btn-secondary btn-disabled">🧑‍🏫 Step by Step Guide (Coming Soon)</span>`;
    
    return `
        <details class="lesson-plan-topic">
            <summary>${topic.title || '[Topic]'}</summary>
            ${objectivesMarkup}
            <div class="lesson-plan-resources">
                ${lessonPlanLink}
                ${guideLink}
            </div>
        </details>
    `;
}

function renderLessonPlanTopicDirect(subsection, section, baseUrl) {
    const learningObjectives = section.learningObjectives || [];
    const subsectionObjectives = Array.isArray(subsection.learningObjectiveRefs)
        ? subsection.learningObjectiveRefs.map(idx => learningObjectives[idx]).filter(obj => obj)
        : [];
    
    const objectivesMarkup = subsectionObjectives.length > 0
        ? `<div class="lesson-plan-topic-objectives">
                <p><strong>Learning Objectives:</strong></p>
                <ul>
                    ${subsectionObjectives.map(obj => `<li>${obj}</li>`).join('')}
                </ul>
           </div>`
        : '';
    
    const lessonPlan = subsection.lessonPlan || {};
    const guide = subsection.guide || {};
    
    const lessonPlanLink = lessonPlan.exists && lessonPlan.url
        ? `<a href="${lessonPlan.url}" class="btn btn-primary" target="_blank" rel="noopener">📄 Lesson Plan</a>`
        : `<span class="btn btn-secondary btn-disabled">📄 Lesson Plan (Coming Soon)</span>`;
    
    const guideLink = guide.exists && guide.url
        ? `<a href="${guide.url}" class="btn btn-primary" target="_blank" rel="noopener">🧑‍🏫 Step by Step Guide</a>`
        : `<span class="btn btn-secondary btn-disabled">🧑‍🏫 Step by Step Guide (Coming Soon)</span>`;
    
    return `
        <div class="lesson-plan-topic-direct">
            <h4>${subsection.title || '[Topic]'}</h4>
            ${objectivesMarkup}
            <div class="lesson-plan-resources">
                ${lessonPlanLink}
                ${guideLink}
            </div>
        </div>
    `;
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
