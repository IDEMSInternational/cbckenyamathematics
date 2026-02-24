/**
 * CSV to Lesson Plans JSON Converter
 * 
 * Converts Website.csv to lesson-plans-catalog.json
 * 
 * Usage: node scripts/csv-to-lesson-plans-json.js
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://innodems.github.io/CBC-Grade-10-Maths/external/lesson_plans/';
const WEBSITE_CSV = path.join(__dirname, '../website-content/data/Website.csv');
const OUTPUT_JSON = path.join(__dirname, '../website-content/data/lesson-plans-catalog.json');

/**
 * Parse CSV content into array of objects
 */
function parseCSV(csvContent) {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
        return [];
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    // Parse data rows
    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        // Simple CSV parsing with quote handling
        const values = [];
        let currentValue = '';
        let insideQuotes = false;
        
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            const nextChar = line[j + 1];
            
            if (char === '"' && nextChar === '"') {
                currentValue += '"';
                j++; // Skip next quote
            } else if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());
        
        const row = {};
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        data.push(row);
    }

    return data;
}

/**
 * Generate URL-safe ID from text
 */
function generateId(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

/**
 * Validate the parsed data
 */
function validateData(websiteData) {
    const errors = [];
    const warnings = [];

    console.log('\n🔍 Validating data...');

    // Check for required columns
    const requiredColumns = [
        'Chapter', 'Section', 'Subsection',
        'Chapter Filecase', 'Section Filecase', 'Subsection Filecase',
        'Lesson Plan Path', 'Lesson Plan Exists',
        'LO 1'
    ];
    
    if (websiteData.length > 0) {
        const columns = Object.keys(websiteData[0]);
        requiredColumns.forEach(col => {
            if (!columns.includes(col)) {
                errors.push(`Missing required column in Website.csv: ${col}`);
            }
        });
    } else {
        errors.push('Website.csv appears to be empty');
    }

    // Check for common typos in subsection/subsubsection names
    const typoPatterns = [
        { pattern: /accel[ae]ration/i, correct: 'acceleration' },
        { pattern: /occurance/i, correct: 'occurrence' },
        { pattern: /seperate/i, correct: 'separate' }
    ];

    websiteData.forEach((row, idx) => {
        const subsectionName = row['Subsection'] || '';
        const subsubsectionName = row['Subsubsection'] || '';
        
        typoPatterns.forEach(({ pattern, correct }) => {
            if (pattern.test(subsectionName) && !subsectionName.match(new RegExp(correct, 'i'))) {
                warnings.push(`Possible typo in "${subsectionName}" (row ${idx + 2}), did you mean "${correct}"?`);
            }
            if (pattern.test(subsubsectionName) && !subsubsectionName.match(new RegExp(correct, 'i'))) {
                warnings.push(`Possible typo in "${subsubsectionName}" (row ${idx + 2}), did you mean "${correct}"?`);
            }
        });

        // Warn if learning objectives are missing
        const hasLO = row['LO 1'] && row['LO 1'].trim();
        if (!hasLO) {
            warnings.push(`No learning objectives found for row ${idx + 2}`);
        }
    });

    // Report results
    if (errors.length > 0) {
        console.error('\n❌ Validation Errors:');
        errors.forEach(err => console.error(`   - ${err}`));
    }

    if (warnings.length > 0) {
        console.warn('\n⚠️  Validation Warnings:');
        warnings.forEach(warn => console.warn(`   - ${warn}`));
    }

    if (errors.length === 0 && warnings.length === 0) {
        console.log('   ✓ All validation checks passed');
    }

    return { errors, warnings };
}

/**
 * Build the lesson plans catalog structure
 */
function buildCatalog(websiteData) {
    const catalog = {
        baseUrl: BASE_URL,
        chapters: []
    };

    // Build hierarchy
    const chapterMap = new Map();

    websiteData.forEach(row => {
        const chapterName = row.Chapter;
        const sectionName = row.Section;
        const subsectionName = row.Subsection;
        const subsubsectionName = row.Subsubsection;

        if (!chapterName || !sectionName) return;

        // Get or create chapter
        if (!chapterMap.has(chapterName)) {
            chapterMap.set(chapterName, {
                id: row['Chapter Filecase'] || generateId(chapterName),
                title: chapterName,
                sections: new Map()
            });
        }
        const chapter = chapterMap.get(chapterName);

        // Get or create section
        if (!chapter.sections.has(sectionName)) {
            chapter.sections.set(sectionName, {
                id: row['Section Filecase'] || generateId(sectionName),
                title: sectionName,
                courseUrl: row['Course URL'] || null,
                learningObjectives: [],
                learningObjectivesMap: new Map(),
                subsections: new Map()
            });
        }
        const section = chapter.sections.get(sectionName);

        // Update course URL if we find one (in case it's on later rows)
        if (row['Course URL'] && row['Course URL'].trim() && !section.courseUrl) {
            section.courseUrl = row['Course URL'].trim();
        }

        // Collect learning objectives at section level
        const los = [row['LO 1'], row['LO 2'], row['LO 3'], row['LO 4']]
            .filter(lo => lo && lo.trim());
        
        los.forEach(lo => {
            if (!section.learningObjectivesMap.has(lo)) {
                const index = section.learningObjectives.length;
                section.learningObjectives.push(lo);
                section.learningObjectivesMap.set(lo, index);
            }
        });

        // Get learning objective refs for this topic
        const loRefs = los.map(lo => section.learningObjectivesMap.get(lo));

        // Handle subsections
        const hasSubsubsection = subsubsectionName && subsubsectionName.trim();

        if (!hasSubsubsection) {
            // Direct topic (no subsubsection)
            if (!section.subsections.has(subsectionName)) {
                section.subsections.set(subsectionName, {
                    id: row['Subsection Filecase'] || generateId(subsectionName),
                    title: subsectionName,
                    hasSubtopics: false,
                    learningObjectiveRefs: loRefs,
                    lessonPlan: {
                        url: row['Lesson Plan Path'] ? BASE_URL + row['Lesson Plan Path'] : '',
                        exists: row['Lesson Plan Exists'] === 'YES'
                    },
                    guide: {
                        url: row['Step By Step Guide Path'] ? BASE_URL + row['Step By Step Guide Path'] : '',
                        exists: row['Step By Step Guide Exists'] === 'YES'
                    }
                });
            }
        } else {
            // Has subsubsections - create/update subsection with topics
            if (!section.subsections.has(subsectionName)) {
                section.subsections.set(subsectionName, {
                    id: row['Subsection Filecase'] || generateId(subsectionName),
                    title: subsectionName,
                    hasSubtopics: true,
                    topics: []
                });
            }
            
            const subsection = section.subsections.get(subsectionName);
            
            // Ensure it's marked as having topics
            if (!subsection.hasSubtopics) {
                subsection.hasSubtopics = true;
                subsection.topics = [];
            }

            // Add topic (subsubsection)
            subsection.topics.push({
                id: row['Subsubsection Filecase'] || generateId(subsubsectionName),
                title: subsubsectionName,
                learningObjectiveRefs: loRefs,
                lessonPlan: {
                    url: row['Lesson Plan Path'] ? BASE_URL + row['Lesson Plan Path'] : '',
                    exists: row['Lesson Plan Exists'] === 'YES'
                },
                guide: {
                    url: row['Step By Step Guide Path'] ? BASE_URL + row['Step By Step Guide Path'] : '',
                    exists: row['Step By Step Guide Exists'] === 'YES'
                }
            });
        }
    });

    // Convert maps to arrays
    chapterMap.forEach(chapter => {
        const sectionsArray = [];
        
        chapter.sections.forEach(section => {
            const subsectionsArray = [];
            
            section.subsections.forEach(subsection => {
                // Clean up the subsection object
                const cleanSubsection = {
                    id: subsection.id,
                    title: subsection.title,
                    hasSubtopics: subsection.hasSubtopics
                };

                if (subsection.hasSubtopics) {
                    cleanSubsection.topics = subsection.topics;
                } else {
                    cleanSubsection.learningObjectiveRefs = subsection.learningObjectiveRefs;
                    cleanSubsection.lessonPlan = subsection.lessonPlan;
                    cleanSubsection.guide = subsection.guide;
                }

                subsectionsArray.push(cleanSubsection);
            });

            const sectionObj = {
                id: section.id,
                title: section.title,
                learningObjectives: section.learningObjectives,
                subsections: subsectionsArray
            };

            // Add course object if URL exists
            if (section.courseUrl) {
                sectionObj.course = {
                    title: section.title,
                    url: section.courseUrl
                };
            }

            sectionsArray.push(sectionObj);
        });

        catalog.chapters.push({
            id: chapter.id,
            title: chapter.title,
            sections: sectionsArray
        });
    });

    return catalog;
}

/**
 * Main execution
 */
function main() {
    try {
        console.log('📖 Reading CSV file...');
        
        // Check file exists
        if (!fs.existsSync(WEBSITE_CSV)) {
            throw new Error(`Website CSV not found: ${WEBSITE_CSV}`);
        }

        // Read and parse CSV
        const websiteContent = fs.readFileSync(WEBSITE_CSV, 'utf-8');
        
        console.log('📊 Parsing CSV data...');
        const websiteData = parseCSV(websiteContent);
        
        console.log(`   Website data: ${websiteData.length} rows`);

        // Validate data
        const validation = validateData(websiteData);
        if (validation.errors.length > 0) {
            console.error('\n❌ Validation failed. Please fix errors before continuing.');
            process.exit(1);
        }

        // Build catalog
        console.log('🔨 Building lesson plans catalog...');
        const catalog = buildCatalog(websiteData);
        
        console.log(`   Generated ${catalog.chapters.length} chapters`);
        catalog.chapters.forEach(chapter => {
            console.log(`   - ${chapter.title}: ${chapter.sections.length} sections`);
        });

        // Write output
        console.log('💾 Writing JSON file...');
        fs.writeFileSync(OUTPUT_JSON, JSON.stringify(catalog, null, 2), 'utf-8');
        
        console.log('✅ Conversion completed successfully!');
        console.log(`📄 Output: ${OUTPUT_JSON}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the script
main();
