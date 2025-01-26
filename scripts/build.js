const fs = require('fs-extra');
const path = require('path');
const marked = require('marked');
const frontMatter = require('front-matter');

// Configure paths
const CONTENT_DIR = path.join(__dirname, '../content');
const OUTPUT_DIR = path.join(__dirname, '../dist');
const PUBLIC_DIR = path.join(__dirname, '../public');

async function build() {
    try {
        console.log('Starting build process...');
        
        // Ensure directories exist
        await fs.ensureDir(CONTENT_DIR);
        await fs.ensureDir(OUTPUT_DIR);
        await fs.ensureDir(PUBLIC_DIR);
        
        console.log('Cleaning output directory...');
        // Clean and ensure output directory exists
        await fs.emptyDir(OUTPUT_DIR);
        
        console.log('Copying public files...');
        // Copy static assets from public directory
        await fs.copy(PUBLIC_DIR, OUTPUT_DIR);
        
        // Verify files were copied
        const distContents = await fs.readdir(OUTPUT_DIR);
        console.log('Dist directory contents:', distContents);

        // Build pages
        const pagesDir = path.join(CONTENT_DIR, 'pages');
        await fs.ensureDir(pagesDir);
        
        try {
            const files = await fs.readdir(pagesDir);
            console.log('Markdown files found:', files);
            
            for (const file of files) {
                if (file.endsWith('.md')) {
                    console.log(`Processing ${file}...`);
                    const content = await fs.readFile(path.join(pagesDir, file), 'utf-8');
                    const { attributes, body } = frontMatter(content);
                    const html = marked(body);
                    
                    // Create HTML file
                    const outputPath = path.join(OUTPUT_DIR, file.replace('.md', '.html'));
                    await fs.writeFile(outputPath, wrapHTML(html, attributes.title));
                }
            }

            // Create index.html in dist if it doesn't exist
            const indexPath = path.join(OUTPUT_DIR, 'index.html');
            if (!await fs.pathExists(indexPath)) {
                // Copy from public directory
                const publicIndexPath = path.join(PUBLIC_DIR, 'index.html');
                if (await fs.pathExists(publicIndexPath)) {
                    await fs.copy(publicIndexPath, indexPath);
                }
            }

        } catch (error) {
            console.error('Error processing markdown files:', error);
        }

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
        throw error;
    }
}

function wrapHTML(content, title) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${title}</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <header>
                <!-- Add your navigation here -->
            </header>
            <main>
                ${content}
            </main>
            <footer>
                <p>&copy; 2024 Your Site. All rights reserved.</p>
            </footer>
        </body>
        </html>
    `;
}

build().catch(console.error); 