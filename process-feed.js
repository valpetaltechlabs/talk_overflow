const fs = require('fs');
const path = require('path');
const { parseStringPromise } = require('xml2js');
const handlebars = require('handlebars');
const sanitizeFilename = require('sanitize-filename');

async function processFeed() {
  try {
    // Read the RSS feed
    const feedXml = fs.readFileSync('feed.rss', 'utf-8');

    // Read the template
    const templateContent = fs.readFileSync('assets/substack-template.md', 'utf-8');
    const template = handlebars.compile(templateContent, { noEscape: true });

    // Parse the XML
    const result = await parseStringPromise(feedXml, { explicitArray: false });

    // Get the items
    const items = Array.isArray(result.rss.channel.item)
      ? result.rss.channel.item
      : [result.rss.channel.item];

    // Create output directory if it doesn't exist
    if (!fs.existsSync('posts')) {
      fs.mkdirSync('posts');
      console.log('Output directory "posts" created.');
    }

    // Process each item
    const maxPosts = 15; // Same as in workflow
    const processedItems = items.slice(0, maxPosts);

    processedItems.forEach(item => {
      // Extract data
      const title = item.title.replace(/^\[.*?\]\s*/, ''); // Remove prefix like "[Talk::Overflow #10]"
      const sanitizedTitle = title.replace(/[^\w\s]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
      const date = new Date(item.pubDate);
      const isoDate = date.toISOString();

      // Get image URL if available
      const image = item.enclosure && item.enclosure.$ ? item.enclosure.$.url : '';

      // Content with HTML
      const content = item['content:encoded'];

      // Create post data
      const postData = {
        title: item.title.replace(/^\[|\]$/g, ''),
        isoDate: isoDate,
        description: item.description,
        image: image,
        link: item.link,
        pubDate: new Date(item.pubDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        content: content
      };

      // Generate the markdown content
      const markdownContent = template(postData);

      // Create a filename
      const filename = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${sanitizedTitle}.md`;
      const outputPath = path.join('posts', sanitizeFilename(filename));

      // Write the file
      fs.writeFileSync(outputPath, markdownContent);
      console.log(`Created: ${outputPath}`);
    });

    console.log(`Successfully processed ${processedItems.length} posts.`);
  } catch (error) {
    console.error('Error processing feed:', error);
  }
}

processFeed();
