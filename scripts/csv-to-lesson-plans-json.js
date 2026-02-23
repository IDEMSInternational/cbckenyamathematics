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
 * Validate the parsed data
 */
function validateData(bookStructure, fileMatching) {
    const errors = [];
    const warnings = [];

    console.log('\n🔍 Validating data...');

    // Check for required columns in book structure
    const requiredBookColumns = ['Chapter', 'Section', 'Subsection', 'Lesson Name', 'LO 1'];
    if (bookStructure.length > 0) {
        const bookColumns = Object.keys(bookStructure[0]);
        requiredBookColumns.forEach(col => {
            if (!bookColumns.includes(col)) {
                errors.push(`Missing required column in book-structure.csv: ${col}`);
            }
        });
    }

    // Check for required columns in file matching
    const requiredFileColumns = ['Chapter', 'Section', 'Subsection', 'Lesson Plan Path', 'Lesson Plan Exists'];
    if (fileMatching.length > 0) {
        const fileColumns = Object.keys(fileMatching[0]);
        requiredFileColumns.forEach(col => {
            if (!fileColumns.includes(col)) {
                errors.push(`Missing required column in file-matching.csv: ${col}`);
            }
        });
    }

    // Check for LO consistency between files
    const bookLOs = new Map();
    bookStructure.forEach((row, idx) => {
        const key = `${row.Chapter}|${row.Section}|${row.Subsection}|${row.Subsubsection}`.toLowerCase();
        const los = [row['LO 1'], row['LO 2'], row['LO 3'], row['LO 4']].filter(lo => lo && lo.trim());
        if (los.length > 0) {
            bookLOs.set(key, { los, row: idx + 2, lessonName: row['Lesson Name'] });
        }
    });

    fileMatching.forEach((row, idx) => {
        const key = `${row.Chapter}|${row.Section}|${row.Subsection}|${row.Subsubsection}`.toLowerCase();
        const fileLOs = [row['LO 1'], row['LO 2'], row['LO 3'], row['LO 4']].filter(lo => lo && lo.trim());
        
        if (bookLOs.has(key)) {
            const bookData = bookLOs.get(key);
            const bookLOsStr = bookData.los.join('|');
            const fileLOsStr = fileLOs.join('|');
            
            if (bookLOsStr !== fileLOsStr) {
                warnings.push(
                    `LO mismatch for "${bookData.lessonName}" (book row ${bookData.row}, file row ${idx + 2}):\n` +
                    `  Book: ${bookLOsStr.substring(0, 80)}${bookLOsStr.length > 80 ? '...' : ''}\n` +
                    `  File: ${fileLOsStr.substring(0, 80)}${fileLOsStr.length > 80 ? '...' : ''}`
                );
            }
        }
    });

    // Check for common typos
    const typoPatterns = [
        { pattern: /accel[ae]ration/i, correct: 'acceleration' },
        { pattern: /occurance/i, correct: 'occurrence' },
        { pattern: /seperate/i, correct: 'separate' }
    ];

    bookStructure.forEach((row, idx) => {
        const lessonName = row['Lesson Name'] || '';
        typoPatterns.forEach(({ pattern, correct }) => {
            if (pattern.test(lessonName) && !lessonName.match(new RegExp(correct, 'i'))) {
                warnings.push(`Possible typo in "${lessonName}" (row ${idx + 2}), did you mean "${correct}"?`);
            }
        });
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

    // Generate URL mapping for chapters
    // Maps full chapter IDs to short URL slugs
    catalog.chapterUrlMap = {};
    catalog.chapters.forEach(chapter => {
        // Extract first word from chapter ID as the URL slug
        const urlSlug = chapter.id.split('-')[0];
        catalog.chapterUrlMap[chapter.id] = urlSlug;
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

        // Validate data
        const validation = validateData(bookStructure, fileMatching);
        if (validation.errors.length > 0) {
            console.error('\n❌ Validation failed. Please fix errors before continuing.');
            process.exit(1);
        }

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
