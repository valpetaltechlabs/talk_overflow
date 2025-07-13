const fs = require('fs');
const path = require('path');

// Directory containing the posts
const postsDir = path.join(__dirname, 'posts');

// Function to extract YouTube URL from iframe src attribute
function extractYouTubeUrl(iframeSrc) {
  // Extract the base URL without query parameters
  const baseUrl = iframeSrc.split('?')[0];
  // Convert from embed URL to watch URL
  return baseUrl.replace('www.youtube-nocookie.com/embed/', 'www.youtube.com/watch?v=');
}

// Process a single file
function processFile(filePath) {
  console.log(`Processing ${filePath}...`);

  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');

  // Count iframes before replacement
  const iframeCount = (content.match(/<iframe[^>]*>/g) || []).length;

  if (iframeCount === 0) {
    console.log(`  No iframes found in ${path.basename(filePath)}`);
    return;
  }

  // First, try with the full div structure
  let replacedCount = 0;

  // Regular expression to match iframe elements with their container divs
  const iframeRegex = /<div[^>]*class="youtube-wrap"[^>]*>.*?<div[^>]*class="youtube-inner"[^>]*><iframe src="([^"]+)"[^>]*><\/iframe><\/div><\/div>/gs;

  // Replace each iframe with a link
  let match;

  while ((match = iframeRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const iframeSrc = match[1];
    const youtubeUrl = extractYouTubeUrl(iframeSrc);

    // Create replacement link
    const replacement = `<p><a href="${youtubeUrl}">Link to Video</a></p>`;

    // Replace the iframe with the link
    content = content.replace(fullMatch, replacement);
    replacedCount++;
  }

  // Now try to catch any remaining iframes directly
  const directIframeRegex = /<iframe src="([^"]+)"[^>]*><\/iframe>/g;

  while ((match = directIframeRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const iframeSrc = match[1];
    const youtubeUrl = extractYouTubeUrl(iframeSrc);

    // Create replacement link
    const replacement = `<a href="${youtubeUrl}">Link to Video</a>`;

    // Replace the iframe with the link
    content = content.replace(fullMatch, replacement);
    replacedCount++;
  }

  // Final catch for any remaining iframe patterns with their container divs
  const remainingDivIframeRegex = /<div[^>]*>.*?<iframe[^>]*src="([^"]+)"[^>]*>.*?<\/iframe>.*?<\/div>/gs;

  while ((match = remainingDivIframeRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const iframeSrc = match[1];
    const youtubeUrl = extractYouTubeUrl(iframeSrc);

    // Create replacement link
    const replacement = `<p><a href="${youtubeUrl}">Link to Video</a></p>`;

    // Replace the iframe with the link
    content = content.replace(fullMatch, replacement);
    replacedCount++;
  }

  // Write the modified content back to the file
  fs.writeFileSync(filePath, content);

  console.log(`  Replaced ${replacedCount} iframes in ${path.basename(filePath)}`);
}

// Process all markdown files in the posts directory
fs.readdir(postsDir, (err, files) => {
  if (err) {
    console.error(`Error reading directory: ${err}`);
    return;
  }

  // Filter for markdown files
  const markdownFiles = files.filter(file => file.endsWith('.md'));

  console.log(`Found ${markdownFiles.length} markdown files`);

  // Process each file
  markdownFiles.forEach(file => {
    const filePath = path.join(postsDir, file);
    processFile(filePath);
  });

  console.log('All files processed!');
});
