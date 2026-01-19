import fs from 'fs';
import https from 'https';

// Read the wikimedia.htm file
const wikimediaFile = fs.readFileSync('app/db/wikimedia.htm', 'utf-8');
const lines = wikimediaFile.split('\n').filter(line => line.trim());

// Filter out direct image URLs - we only want wiki pages
const wikiPages = lines.filter(line => line.includes('/wiki/File:'));

console.log(`Processing ${wikiPages.length} wiki pages...`);

const results = [];
let processed = 0;

// Function to fetch and parse a wiki page
function fetchWikiPage(url) {
  return new Promise((resolve) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
    
    https.get(url, options, (res) => {
      let data = '';
      
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchWikiPage(res.headers.location).then(resolve);
        return;
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          resolve({ url, status: 'page_not_found' });
          return;
        }
        
        // Extract the image src from the page
        // Look for the main image in the file page
        // Try multiple patterns
        let imageSrc = null;
        
        // Pattern 1: fullImageLink
        const fullImageLinkMatch = data.match(/<a[^>]+class="[^"]*mw-file-description[^"]*"[^>]+href="(https:\/\/upload\.wikimedia\.org\/[^"]+\.gif)"[^>]*>/i);
        if (fullImageLinkMatch) {
          imageSrc = fullImageLinkMatch[1];
        }
        
        // Pattern 2: Direct img tag with upload.wikimedia.org
        if (!imageSrc) {
          const imgMatch = data.match(/<img[^>]+src="(https:\/\/upload\.wikimedia\.org\/[^"]+\.gif)"[^>]*>/i);
          if (imgMatch) {
            imageSrc = imgMatch[1];
          }
        }
        
        // Pattern 3: Look in meta property og:image
        if (!imageSrc) {
          const ogImageMatch = data.match(/<meta\s+property="og:image"\s+content="(https:\/\/upload\.wikimedia\.org\/[^"]+\.gif)"[^>]*>/i);
          if (ogImageMatch) {
            imageSrc = ogImageMatch[1];
          }
        }
        
        if (imageSrc) {
          // Decode URL entities
          imageSrc = imageSrc.replace(/&amp;/g, '&');
          resolve({ url, imageSrc, status: 'success' });
        } else {
          resolve({ url, status: 'image_not_found' });
        }
      });
    }).on('error', (err) => {
      resolve({ url, status: 'page_not_found', error: err.message });
    });
  });
}

// Process URLs in batches to avoid overwhelming the server
async function processInBatches(urls, batchSize = 10) {
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(url => fetchWikiPage(url)));
    results.push(...batchResults);
    processed += batch.length;
    console.log(`Processed ${processed}/${urls.length} pages...`);
    
    // Add a small delay between batches
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Process all URLs
processInBatches(wikiPages).then(() => {
  // Generate the JSX content
  const filename = (url) => {
    const match = url.match(/File:([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : url;
  };
  
  const jsxLines = results.map(result => {
    const name = filename(result.url);
    
    if (result.status === 'success') {
      return `  <p><a href="${result.url}" target="_blank">${name}</a>: <img src="${result.imageSrc}" alt="${name}" style={{maxWidth: '400px'}}/></p>`;
    } else if (result.status === 'page_not_found') {
      return `  <p>${name}: can't find the page</p>`;
    } else {
      return `  <p><a href="${result.url}" target="_blank">${name}</a>: can't find the image</p>`;
    }
  }).join('\n');
  
  // Generate the route file
  const routeContent = `export default function Wikimedia() {
  return (
    <div style={{padding: '20px'}}>
      <h1>Wikimedia Brain Images</h1>
      <div>
${jsxLines}
      </div>
    </div>
  );
}
`;
  
  // Write the route file
  fs.writeFileSync('app/routes/wikimedia.tsx', routeContent);
  
  console.log('\\nGeneration complete!');
  console.log(`Success: ${results.filter(r => r.status === 'success').length}`);
  console.log(`Page not found: ${results.filter(r => r.status === 'page_not_found').length}`);
  console.log(`Image not found: ${results.filter(r => r.status === 'image_not_found').length}`);
  console.log('\\nRoute file created at: app/routes/wikimedia.tsx');
});
