/**
 * Navigation Menu Functionality
 * Handles mobile menu toggle and active page highlighting
 */

console.log('✅ navigation.js loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOMContentLoaded fired');
    initMobileMenu();
    highlightActivePage();
    loadPageContent();
    loadResources();
    loadLessonPlanCatalog();
    loadLessonPlanChapterButtons();
    initDropdownPositioning();
    initMenuToggles();
    // Note: initChapterNavigation() is called after page content loads in loadPageContent()
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
                // Remove mobile-open classes when switching to desktop
                document.querySelectorAll('.mobile-open').forEach(el => {
                    el.classList.remove('mobile-open');
                });
            }
        });
        
        // Handle mobile submenu toggles
        initMobileSubmenus();
    }
}

/**
 * Initialize mobile submenu toggle functionality
 */
function initMobileSubmenus() {
    const submenuLinks = document.querySelectorAll('nav li.has-submenu > a');
    
    submenuLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            // Only toggle on mobile
            if (window.innerWidth <= 768) {
                event.preventDefault();
                
                const parentLi = link.parentElement;
                const submenu = parentLi.querySelector(':scope > ul');
                
                if (submenu) {
                    const isOpen = parentLi.classList.contains('mobile-open');
                    
                    // Close other submenus at the same level
                    const siblings = Array.from(parentLi.parentElement.children);
                    siblings.forEach(sibling => {
                        if (sibling !== parentLi && sibling.classList.contains('has-submenu')) {
                            sibling.classList.remove('mobile-open');
                        }
                    });
                    
                    // Toggle current submenu
                    if (isOpen) {
                        parentLi.classList.remove('mobile-open');
                    } else {
                        parentLi.classList.add('mobile-open');
                    }
                }
            }
        });
    });
}

/**
 * Highlight the active page in navigation
 */
function highlightActivePage() {
    const params = new URLSearchParams(window.location.search);
    const currentPage = params.get('page') || 'home';
    const currentChapter = params.get('chapter');
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

        // For lesson plans pages, also check chapter parameter
        if (currentPage === 'resources-lesson-plans' && currentChapter) {
            if (linkHref.includes(`page=${currentPage}`) && linkHref.includes(`chapter=${currentChapter}`)) {
                link.classList.add('active');
            }
        } else if (linkHref.includes(`page=${currentPage}`)) {
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

    fetch(pagePath, {
        cache: 'no-cache' // Use conditional requests to get fresh content when available
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to load ${pagePath}`);
            }
            return response.text();
        })
        .then(html => {
            container.innerHTML = html;
            populateChapterTemplate();
            loadResources();
            loadLessonPlanCatalog();
            loadLessonPlanChapterButtons();
            initChapterNavigation(); // Initialize chapter nav after content is loaded
        })
        .catch((error) => {
            console.error('Error loading page content:', error);
            container.innerHTML = '<section class="hero"><h2>[Content unavailable]</h2><p>Please refresh the page.</p></section>';
        });
}

/**
 * Populate chapter-specific content in template
 * Reads chapter parameter from URL and updates page title and catalog container
 */
function populateChapterTemplate() {
    const params = new URLSearchParams(window.location.search);
    const chapterId = params.get('chapter');
    
    if (!chapterId) {
        return;
    }

    const dataPath = getLessonPlansDataPath();
    
    fetch(dataPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load lesson plan catalog');
            }
            return response.json();
        })
        .then(data => {
            const chapter = data.chapters.find(ch => ch.id === chapterId);
            
            if (!chapter) {
                console.warn(`Chapter not found: ${chapterId}`);
                return;
            }

            // Update page title
            const titleElement = document.querySelector('[data-chapter-title]');
            if (titleElement) {
                titleElement.textContent = `Lesson Plans, Guides, and Courses: ${chapter.title}`;
            }

            // Update section heading
            const nameElement = document.querySelector('[data-chapter-name]');
            if (nameElement) {
                nameElement.textContent = chapter.title;
            }

            // Set chapter ID on catalog container
            const catalogElement = document.querySelector('.lesson-plan-catalog');
            if (catalogElement) {
                catalogElement.setAttribute('data-lesson-plan-chapter', chapterId);
            }
        })
        .catch((error) => {
            console.error('Error populating chapter template:', error);
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

    fetch(dataPath)
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
        .catch((error) => {
            console.error('Error loading resources:', error);
            resourceLists.forEach(resourceList => {
                resourceList.innerHTML = '<p>Unable to load resources. Please try refreshing the page.</p>';
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

    fetch(dataPath)
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
                return `<a href="index.html?page=resources-lesson-plans&chapter=${chapter.id}" class="btn btn-primary">${chapter.title}</a>`;
            }).join('');

            buttonContainer.innerHTML = buttonsHTML;
        })
        .catch((error) => {
            console.error('Error loading lesson plan chapter buttons:', error);
            buttonContainer.innerHTML = '<p>Unable to load chapters. Please try refreshing the page.</p>';
        });
}

function loadLessonPlanCatalog() {
    const chapterContainers = document.querySelectorAll('[data-lesson-plan-chapter]');

    if (chapterContainers.length === 0) {
        return;
    }

    const dataPath = getLessonPlansDataPath();

    fetch(dataPath)
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
            initAccordions();
        })
        .catch((error) => {
            console.error('Error loading lesson plan catalog:', error);
            chapterContainers.forEach(container => {
                container.innerHTML = '<p>Unable to load lesson plans. Please try refreshing the page.</p>';
            });
        });
}

/**
 * Initialize accordion behavior for all accordion types
 */
function initAccordions() {
    // Section level accordions - only one section can be open at a time
    initAccordionLevel('.lesson-plan-section', null);
    
    // Subsection level accordions - only one subsection open per section
    initAccordionLevel('.lesson-plan-subsection', '.lesson-plan-section');
    
    // Topic level accordions - only one topic open per subsection
    initAccordionLevel('.lesson-plan-topic', '.lesson-plan-subsection');
}

/**
 * Initialize accordion behavior for a specific level
 * @param {string} itemSelector - CSS selector for the accordion items
 * @param {string|null} parentSelector - CSS selector for the parent container, or null for page-level
 */
function initAccordionLevel(itemSelector, parentSelector) {
    const items = document.querySelectorAll(itemSelector);
    
    items.forEach(item => {
        item.addEventListener('toggle', function() {
            if (this.open) {
                // Get sticky header height for offset calculation
                const header = document.querySelector('header');
                const headerHeight = header ? header.offsetHeight : 0;
                const offset = headerHeight + 20; // Add 20px padding below header
                
                // Store the position of the clicked element before closing others
                const clickedElementRect = this.getBoundingClientRect();
                const clickedElementTop = clickedElementRect.top;
                const scrollBefore = window.pageYOffset || document.documentElement.scrollTop;
                
                // Find siblings to close
                let siblings;
                if (parentSelector) {
                    const parent = this.closest(parentSelector);
                    siblings = parent ? parent.querySelectorAll(itemSelector) : [];
                } else {
                    siblings = document.querySelectorAll(itemSelector);
                }
                
                // Close all other items at this level
                siblings.forEach(sibling => {
                    if (sibling !== this && sibling.open) {
                        sibling.open = false;
                    }
                });
                
                // Allow the DOM to update, then adjust scroll position
                requestAnimationFrame(() => {
                    const clickedElementRectAfter = this.getBoundingClientRect();
                    const clickedElementTopAfter = clickedElementRectAfter.top;
                    
                    // If element top is at or above the safe zone (below header), scroll it down
                    if (clickedElementTopAfter <= offset) {
                        // Scroll to position element below the header with padding
                        const elementAbsoluteTop = this.offsetTop;
                        window.scrollTo({
                            top: elementAbsoluteTop - offset,
                            behavior: 'smooth'
                        });
                    } else if (clickedElementTopAfter !== clickedElementTop) {
                        // Element moved but is visible - keep it in place
                        const scrollAfter = window.pageYOffset || document.documentElement.scrollTop;
                        const shift = clickedElementTopAfter - clickedElementTop;
                        
                        window.scrollTo({
                            top: scrollAfter - shift,
                            behavior: 'instant'
                        });
                    }
                });
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
    const course = section.course || {};
    
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

/**
 * Initialize Chapter Navigation
 */
function initChapterNavigation() {
    console.log('🔍 Initializing chapter navigation...');
    
    const chapterNav = document.getElementById('chapterNav');
    console.log('Chapter nav element:', chapterNav);
    
    if (!chapterNav) {
        console.log('❌ No chapter nav element found - not on lesson plans page');
        return; // Not on lesson plans page
    }

    const params = new URLSearchParams(window.location.search);
    const currentChapterId = params.get('chapter');
    console.log('Current chapter ID from URL:', currentChapterId);

    if (!currentChapterId) {
        console.log('❌ No chapter ID in URL');
        return; // No chapter selected
    }

    console.log('📚 Fetching lesson plans data...');
    
    // Load chapters and set up navigation
    fetch(getLessonPlansDataPath())
        .then(response => {
            console.log('Fetch response:', response);
            return response.json();
        })
        .then(data => {
            console.log('Lesson plans data:', data);
            const chapters = data.chapters || [];
            console.log('Chapters:', chapters);
            setupChapterNavigation(chapters, currentChapterId);
        })
        .catch(error => {
            console.error('❌ Error loading chapters for navigation:', error);
        });
}

function setupChapterNavigation(chapters, currentChapterId) {
    console.log('⚙️ Setting up chapter navigation...');
    console.log('Chapters array:', chapters);
    console.log('Current chapter ID:', currentChapterId);
    
    const currentIndex = chapters.findIndex(ch => ch.id === currentChapterId);
    console.log('Current chapter index:', currentIndex);
    
    if (currentIndex === -1) {
        console.log('❌ Chapter not found in chapters array');
        return; // Chapter not found
    }

    const prevBtn = document.getElementById('prevChapter');
    const nextBtn = document.getElementById('nextChapter');
    const dropdownBtn = document.getElementById('chapterDropdownBtn');
    const menu = document.getElementById('chapterMenu');
    const currentLabel = document.querySelector('[data-current-chapter-name]');

    console.log('UI Elements:', { prevBtn, nextBtn, dropdownBtn, menu, currentLabel });

    // Update current chapter label
    if (currentLabel) {
        currentLabel.textContent = chapters[currentIndex].title;
        console.log('✅ Updated current chapter label:', chapters[currentIndex].title);
    }

    // Populate dropdown menu
    menu.innerHTML = chapters.map(chapter => {
        const isCurrent = chapter.id === currentChapterId;
        return `
            <li>
                <button 
                    class="${isCurrent ? 'current' : ''}" 
                    data-chapter-id="${chapter.id}"
                    role="menuitem">
                    ${chapter.title}
                </button>
            </li>
        `;
    }).join('');
    
    console.log('✅ Populated dropdown menu with', chapters.length, 'chapters');

    // Set up prev/next buttons
    if (currentIndex === 0) {
        prevBtn.disabled = true;
        console.log('⬅️ Prev button disabled (first chapter)');
    } else {
        prevBtn.disabled = false;
        prevBtn.onclick = () => {
            console.log('⬅️ Prev button clicked - navigating to:', chapters[currentIndex - 1].id);
            navigateToChapter(chapters[currentIndex - 1].id);
        };
        console.log('⬅️ Prev button enabled');
    }

    if (currentIndex === chapters.length - 1) {
        nextBtn.disabled = true;
        console.log('➡️ Next button disabled (last chapter)');
    } else {
        nextBtn.disabled = false;
        nextBtn.onclick = () => {
            console.log('➡️ Next button clicked - navigating to:', chapters[currentIndex + 1].id);
            navigateToChapter(chapters[currentIndex + 1].id);
        };
        console.log('➡️ Next button enabled');
    }

    // Set up dropdown
    dropdownBtn.onclick = (e) => {
        console.log('🖱️ Dropdown button clicked');
        e.stopPropagation();
        const isExpanded = dropdownBtn.getAttribute('aria-expanded') === 'true';
        console.log('Is expanded?', isExpanded, '→ toggling to', !isExpanded);
        toggleDropdown(!isExpanded);
    };

    console.log('✅ Dropdown button handler attached');

    // Set up menu item clicks
    menu.querySelectorAll('button').forEach(btn => {
        btn.onclick = () => {
            console.log('🖱️ Menu item clicked');
            const chapterId = btn.getAttribute('data-chapter-id');
            if (chapterId && chapterId !== currentChapterId) {
                navigateToChapter(chapterId);
            } else {
                toggleDropdown(false);
            }
        };
    });

    console.log('✅ Menu item handlers attached');

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdownBtn.contains(e.target) && !menu.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Close dropdown on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            toggleDropdown(false);
        }
    });
}

function toggleDropdown(show) {
    console.log('🔄 toggleDropdown called with show =', show);
    
    const dropdownBtn = document.getElementById('chapterDropdownBtn');
    const menu = document.getElementById('chapterMenu');
    
    console.log('Dropdown elements:', { dropdownBtn, menu });
    
    if (!dropdownBtn || !menu) {
        console.log('❌ Missing dropdown elements');
        return;
    }
    
    if (show) {
        console.log('✅ Opening dropdown');
        dropdownBtn.setAttribute('aria-expanded', 'true');
        menu.classList.add('active');
    } else {
        console.log('✅ Closing dropdown');
        dropdownBtn.setAttribute('aria-expanded', 'false');
        menu.classList.remove('active');
    }
    
    console.log('Dropdown state:', {
        expanded: dropdownBtn.getAttribute('aria-expanded'),
        menuClasses: menu.className
    });
}

function navigateToChapter(chapterId) {
    const url = new URL(window.location.href);
    url.searchParams.set('chapter', chapterId);
    window.location.href = url.toString();
}
