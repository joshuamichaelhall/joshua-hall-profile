const fs = require('fs');
const axios = require('axios');
const Parser = require('rss-parser');

const parser = new Parser();
const README_PATH = 'README.md';

// Function to fetch blog posts
async function fetchBlogPosts() {
  try {
    // Try to fetch posts from RSS feed first
    try {
      const feed = await parser.parseURL('https://joshuamichaelhall.com/feed.xml');
      
      return feed.items
        .slice(0, 5) // Get the 5 most recent posts
        .map(item => {
          return {
            title: item.title,
            url: item.link,
            date: new Date(item.pubDate).toISOString().split('T')[0]
          };
        });
    } catch (error) {
      console.log('RSS feed fetch failed, trying alternative method...');
      
      // If RSS feed doesn't work, scrape the blog page as a fallback
      // This is a simplified example and would need to be adapted to your site structure
      const { data } = await axios.get('https://joshuamichaelhall.com/blog/');
      
      // Very basic HTML parsing - you may need a proper parser like cheerio
      // This is just an example that would need to be customized to your site
      const posts = [];
      const regex = /<a href="(\/blog\/\d{4}\/\d{2}\/\d{2}\/[^"]+\/)">[^<]+<\/a>/g;
      let match;
      
      while ((match = regex.exec(data)) !== null && posts.length < 5) {
        const href = match[1];
        const title = match[0].replace(/<a href="[^"]+">([^<]+)<\/a>/, '$1');
        
        posts.push({
          title,
          url: `https://joshuamichaelhall.com${href}`,
          date: href.match(/\/blog\/(\d{4}\/\d{2}\/\d{2})\//)[1].replace(/\//g, '-')
        });
      }
      
      return posts;
    }
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

// Function to update README
async function updateReadme() {
  try {
    const posts = await fetchBlogPosts();
    if (posts.length === 0) {
      console.log('No posts found or error occurred.');
      return;
    }
    
    const readmeContent = fs.readFileSync(README_PATH, 'utf8');
    
    // Define start and end markers for the blog posts section
    const startMarker = '<!-- BLOG-POST-LIST:START -->';
    const endMarker = '<!-- BLOG-POST-LIST:END -->';
    
    // Check if markers exist in the README
    if (!readmeContent.includes(startMarker) || !readmeContent.includes(endMarker)) {
      console.log('Markers not found in README. Please add them.');
      return;
    }
    
    // Generate new blog posts list
    let newBlogPostsSection = `${startMarker}\n## Latest Blog Posts\n\n`;
    
    posts.forEach(post => {
      newBlogPostsSection += `- [${post.title}](${post.url}) (${post.date})\n`;
    });
    
    newBlogPostsSection += `\n${endMarker}`;
    
    // Replace the old section with the new one
    const newReadmeContent = readmeContent.replace(
      new RegExp(`${startMarker}[\\s\\S]*${endMarker}`),
      newBlogPostsSection
    );
    
    // Write the updated content back to the README
    fs.writeFileSync(README_PATH, newReadmeContent);
    
    console.log('README updated successfully with latest blog posts.');
  } catch (error) {
    console.error('Error updating README:', error);
  }
}

updateReadme();