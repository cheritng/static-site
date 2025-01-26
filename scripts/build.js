const fs = require('fs-extra');
const path = require('path');
const frontMatter = require('front-matter');
const { marked } = require('marked');

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

async function build() {
    try {
        console.log('Starting build process...');
        
        // Ensure directories exist
        await fs.ensureDir(CONTENT_DIR);
        await fs.ensureDir(OUTPUT_DIR);
        await fs.ensureDir(PUBLIC_DIR);
        
        // Clean output directory
        await fs.emptyDir(OUTPUT_DIR);
        
        // Copy all public files first (including index.html)
        console.log('Copying public files...');
        await fs.copy(PUBLIC_DIR, OUTPUT_DIR);
        
        // Explicitly copy CSS directory
        const cssDir = path.join(PUBLIC_DIR, 'css');
        const distCssDir = path.join(OUTPUT_DIR, 'css');
        await fs.ensureDir(distCssDir);
        await fs.copy(cssDir, distCssDir);
        
        // Build pages from markdown (excluding index)
        const pagesDir = path.join(CONTENT_DIR, 'pages');
        
        try {
            const files = await fs.readdir(pagesDir);
            
            for (const file of files) {
                if (file.endsWith('.md')) {
                    const content = await fs.readFile(path.join(pagesDir, file), 'utf-8');
                    const { attributes, body } = frontMatter(content);
                    const htmlContent = marked(body);
                    
                    // Skip if this is meant to be index.html
                    if (file === 'index.md') {
                        console.log('Skipping index.md as index.html is managed directly');
                        continue;
                    }
                    
                    // Create directory for the page (without .md extension)
                    const pageName = file.replace('.md', '');
                    const pageDir = path.join(OUTPUT_DIR, pageName);
                    await fs.ensureDir(pageDir);
                    
                    // Write index.html in the page directory
                    const outputPath = path.join(pageDir, 'index.html');
                    await fs.writeFile(outputPath, wrapHTML(htmlContent, attributes.title));
                    console.log(`Processed: ${file} -> ${pageName}/index.html`);
                }
            }
        } catch (error) {
            console.error('Error processing markdown files:', error);
        }

        console.log('Build completed successfully!');
    } catch (error) {
        console.error('Build failed:', error);
    }
}

build(); 