const fs = require('fs-extra');
const path = require('path');
const frontMatter = require('front-matter');
const { marked } = require('marked');
const config = require('../config');

// Configure paths
const CONTENT_DIR = path.join(__dirname, '../content');
const OUTPUT_DIR = path.join(__dirname, '../dist');
const PUBLIC_DIR = path.join(__dirname, '../public');

function wrapHTML(content, title) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="./css/style.css">
</head>
<body>
    <header>
        <nav>
            <div class="logo">Cheri</div>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/blog">Blog</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/faq">FAQ</a></li>
            </ul>
        </nav>
    </header>
    <main class="content">
        ${content}
    </main>
    <footer>
        <p>&copy; 2024 Cheri. All rights reserved.</p>
    </footer>
</body>
</html>`;
}

function adjustPathsForProduction(html) {
    return html.replace(/%%BASE_PATH%%/g, config.basePath);
}

async function build() {
    try {
        console.log('Starting build process...');
        
        // Ensure directories exist
        await fs.ensureDir(CONTENT_DIR);
        await fs.ensureDir(OUTPUT_DIR);
        await fs.ensureDir(PUBLIC_DIR);
        
        // Clean output directory
        await fs.emptyDir(OUTPUT_DIR);
        
        // Copy all public files
        console.log('Copying public files...');
        await fs.copy(PUBLIC_DIR, OUTPUT_DIR, {
            filter: (src) => {
                return true;
            }
        });
        
        // Ensure index.html is at the root of dist
        const indexHtml = await fs.readFile(path.join(PUBLIC_DIR, 'index.html'), 'utf-8');
        const processedHtml = adjustPathsForProduction(indexHtml);
        await fs.writeFile(path.join(OUTPUT_DIR, 'index.html'), processedHtml);
        
        // Process markdown pages
        const pagesDir = path.join(CONTENT_DIR, 'pages');
        
        try {
            const files = await fs.readdir(pagesDir);
            
            for (const file of files) {
                if (file.endsWith('.md')) {
                    const content = await fs.readFile(path.join(pagesDir, file), 'utf-8');
                    const { attributes, body } = frontMatter(content);
                    const htmlContent = marked(body);
                    
                    // Create directory for the page (without .md extension)
                    const pageName = file.replace('.md', '');
                    const pageDir = path.join(OUTPUT_DIR, pageName);
                    await fs.ensureDir(pageDir);
                    
                    // Write index.html in the page directory
                    const outputPath = path.join(pageDir, 'index.html');
                    await fs.writeFile(outputPath, adjustPathsForProduction(wrapHTML(htmlContent, attributes.title)));
                    console.log(`Processed: ${file} -> ${pageName}/index.html`);
                }
            }
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error processing markdown files:', error);
            }
        }

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build error:', error);
        process.exit(1);
    }
}

build(); 