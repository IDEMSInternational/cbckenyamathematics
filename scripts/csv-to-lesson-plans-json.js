/**
 * CSV to Lesson Plans JSON Converter
 * 
 * Converts book-structure.csv and file-matching.csv to lesson-plans-catalog.json
 * 
 * Usage: node scripts/csv-to-lesson-plans-json.js
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://innodems.github.io/CBC-Grade-10-Maths/external/lesson_plans/';
const BOOK_STRUCTURE_CSV = path.join(__dirname, '../website-content/data/book-structure.csv');
const FILE_MATCHING_CSV = path.join(__dirname, '../website-content/data/file-matching.csv');
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
 * Build the lesson plans catalog structure
 */
function buildCatalog(bookStructure, fileMatching) {
    const catalog = {
        baseUrl: BASE_URL,
        chapters: []
    };

    // Create a map for quick lookup of file data
    const fileMap = new Map();
    fileMatching.forEach(row => {
        const key = `${row.Chapter}|${row.Section}|${row.Subsection}|${row.Subsubsection}`.toLowerCase();
        fileMap.set(key, row);
    });

    // Build hierarchy
    const chapterMap = new Map();

    bookStructure.forEach(row => {
        const chapterName = row.Chapter;
        const sectionName = row.Section;
        const subsectionName = row.Subsection;
        const subsubsectionName = row.Subsubsection;

        if (!chapterName || !sectionName) return;

        // Get file matching data
        const fileKey = `${chapterName}|${sectionName}|${subsectionName}|${subsubsectionName}`.toLowerCase();
        const fileData = fileMap.get(fileKey);

        // Get or create chapter
        if (!chapterMap.has(chapterName)) {
            chapterMap.set(chapterName, {
                id: fileData ? fileData['Chapter Filecase'] : generateId(chapterName),
                title: chapterName,
                sections: new Map()
            });
        }
        const chapter = chapterMap.get(chapterName);

        // Get or create section
        if (!chapter.sections.has(sectionName)) {
            chapter.sections.set(sectionName, {
                id: fileData ? fileData['Section Filecase'] : generateId(sectionName),
                title: sectionName,
                learningObjectives: [],
                learningObjectivesMap: new Map(),
                subsections: new Map()
            });
        }
        const section = chapter.sections.get(sectionName);

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
                    id: fileData ? fileData['Subsection Filecase'] : generateId(subsectionName),
                    title: subsectionName,
                    hasSubtopics: false,
                    learningObjectiveRefs: loRefs,
                    lessonPlan: {
                        url: fileData ? BASE_URL + fileData['Lesson Plan Path'] : '',
                        exists: fileData ? (fileData['Lesson Plan Exists'] === 'YES') : false
                    },
                    guide: {
                        url: fileData ? BASE_URL + fileData['Step By Step Guide Path'] : '',
                        exists: fileData ? (fileData['Step By Step Guide Exists'] === 'YES') : false
                    }
                });
            }
        } else {
            // Has subsubsections - create/update subsection with topics
            if (!section.subsections.has(subsectionName)) {
                section.subsections.set(subsectionName, {
                    id: fileData ? fileData['Subsection Filecase'] : generateId(subsectionName),
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
                id: fileData ? fileData['Subsubsection Filecase'] : generateId(subsubsectionName),
                title: subsubsectionName,
                learningObjectiveRefs: loRefs,
                lessonPlan: {
                    url: fileData ? BASE_URL + fileData['Lesson Plan Path'] : '',
                    exists: fileData ? (fileData['Lesson Plan Exists'] === 'YES') : false
                },
                guide: {
                    url: fileData ? BASE_URL + fileData['Step By Step Guide Path'] : '',
                    exists: fileData ? (fileData['Step By Step Guide Exists'] === 'YES') : false
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

            sectionsArray.push({
                id: section.id,
                title: section.title,
                learningObjectives: section.learningObjectives,
                subsections: subsectionsArray
            });
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
        console.log('📖 Reading CSV files...');
        
        // Check files exist
        if (!fs.existsSync(BOOK_STRUCTURE_CSV)) {
            throw new Error(`Book structure CSV not found: ${BOOK_STRUCTURE_CSV}`);
        }
        if (!fs.existsSync(FILE_MATCHING_CSV)) {
            throw new Error(`File matching CSV not found: ${FILE_MATCHING_CSV}`);
        }

        // Read and parse CSVs
        const bookStructureContent = fs.readFileSync(BOOK_STRUCTURE_CSV, 'utf-8');
        const fileMatchingContent = fs.readFileSync(FILE_MATCHING_CSV, 'utf-8');
        
        console.log('📊 Parsing CSV data...');
        const bookStructure = parseCSV(bookStructureContent);
        const fileMatching = parseCSV(fileMatchingContent);
        
        console.log(`   Book structure: ${bookStructure.length} rows`);
        console.log(`   File matching: ${fileMatching.length} rows`);

        // Build catalog
        console.log('🔨 Building lesson plans catalog...');
        const catalog = buildCatalog(bookStructure, fileMatching);
        
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
