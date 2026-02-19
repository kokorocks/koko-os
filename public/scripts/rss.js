
/*
// ---------- RSS Feed List ----------
const RSS_FEEDS = [
    // Technology
    { name: "Ars Technica", rss: "http://feeds.arstechnica.com/arstechnica/index", category: "technology" },
    { name: "Hackaday", rss: "https://hackaday.com/blog/feed/", category: "technology" },
    //{ name: "Wired Tech", rss: "https://www.wired.com/feed/category/tech/latest/rss", category: "technology" },
    { name: "The Verge", rss: "https://www.theverge.com/rss/index.xml", category: "technology" },
    { name: "TechCrunch", rss: "http://feeds.feedburner.com/TechCrunch/", category: "technology" },
    { name: "Engadget", rss: "https://www.engadget.com/rss.xml", category: "technology" },
    { name: "Gizmodo", rss: "https://gizmodo.com/rss", category: "technology" },
    { name: "VentureBeat", rss: "https://venturebeat.com/feed/", category: "technology" },

    // AI / Machine Learning
    //{ name: "OpenAI Blog", rss: "https://openai.com/blog/rss/", category: "ai" },
    { name: "DeepMind Blog", rss: "https://www.deepmind.com/blog/rss.xml", category: "ai" },
    { name: "MIT AI News", rss: "https://www.technologyreview.com/feed/", category: "ai" },
    //{ name: "Google AI Blog", rss: "https://ai.googleblog.com/feeds/posts/default?alt=rss", category: "ai" },

    // Science
    { name: "NYTimes Science", rss: "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml", category: "science" },
    { name: "Wired Science", rss: "https://www.wired.com/feed/category/science/latest/rss", category: "science" },
    { name: "Science Daily", rss: "https://www.sciencedaily.com/rss/all.xml", category: "science" },
    { name: "NASA Breaking News", rss: "https://www.nasa.gov/rss/dyn/breaking_news.rss", category: "science" },
    { name: "Phys.org", rss: "https://phys.org/rss-feed/", category: "science" },

    // Business
    { name: "NYTimes Business", rss: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", category: "business" },
    { name: "Wired Business", rss: "https://www.wired.com/feed/category/business/latest/rss", category: "business" },
    //{ name: "Bloomberg", rss: "https://www.bloomberg.com/feed/podcast/etf.xml", category: "business" },
    { name: "Financial Times", rss: "https://www.ft.com/?format=rss", category: "business" },
    { name: "Forbes", rss: "https://www.forbes.com/business/feed2/", category: "business" },

    // Health
    { name: "NYTimes Health", rss: "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml", category: "health" },
    //{ name: "Medical News Today", rss: "https://www.medicalnewstoday.com/rss", category: "health" },
    //{ name: "WebMD", rss: "https://rssfeeds.webmd.com/rss/rss.aspx?RSSSource=RSS_PUBLIC", category: "health" },

    // Sports
    { name: "NYTimes Sports", rss: "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml", category: "sports" },
    { name: "ESPN Top Headlines", rss: "https://www.espn.com/espn/rss/news", category: "sports" },
    //{ name: "Bleacher Report", rss: "https://bleacherreport.com/articles/feed", category: "sports" },

    // Travel
    { name: "NYTimes Travel", rss: "https://rss.nytimes.com/services/xml/rss/nyt/Travel.xml", category: "travel" },
    //{ name: "Lonely Planet", rss: "https://www.lonelyplanet.com/news/rss", category: "travel" },
    //{ name: "National Geographic Travel", rss: "https://www.nationalgeographic.com/content/natgeo/en_us/travel/rss.xml", category: "travel" },

    // General / Top
    { name: "Wired Top", rss: "https://www.wired.com/feed/rss", category: "top" },
    //{ name: "Times of India", rss: "http://dynamic.feedsportal.com/pf/555218/http://toi.timesofindia.indiatimes.com/rssfeedstopstories.cms", category: "top" },
    { name: "BBC News", rss: "http://feeds.bbci.co.uk/news/rss.xml", category: "top" },
    { name: "CNN Top Stories", rss: "http://rss.cnn.com/rss/cnn_topstories.rss", category: "top" },
    { name: "The Guardian", rss: "https://www.theguardian.com/world/rss", category: "top" },

    // Humor / Comics
    { name: "xkcd", rss: "https://xkcd.com/rss.xml", category: "humor" },
    { name: "The Onion", rss: "https://www.theonion.com/rss", category: "humor" },
    //{ name: "Dilbert", rss: "https://dilbert.com/feed", category: "humor" },

    // Indie Blogs
    //{ name: "Smashing Magazine", rss: "https://www.smashingmagazine.com/feed/", category: "technology" },
    { name: "CSS-Tricks", rss: "https://css-tricks.com/feed/", category: "technology" },
    { name: "Medium Tech", rss: "https://medium.com/feed/topic/technology", category: "technology" },
    { name: "Medium AI", rss: "https://medium.com/feed/topic/artificial-intelligence", category: "ai" }
];

// ---------- Helpers ----------
function getAllFeeds(categories = []) {
    return categories.length
        ? RSS_FEEDS.filter(f => categories.includes(f.category))
        : [...RSS_FEEDS];
}

// ---------- Chunked Loader Parsing RSS XML Directly ----------
async function loadNewsFromRSS({
    categories = ["technology", "science", "top"],
    articlesPerFeed = 5,
    chunkSize = 3,
    delayBetweenChunks = 1500, // 1.5s to avoid server overload
    maxArticles = 200,
    maxDescLength = 250
} = {}) {
    info.news = {};
    let articleIndex = 1;

    const feeds = getAllFeeds(categories);

    for (let i = 0; i < feeds.length; i += chunkSize) {
        const chunk = feeds.slice(i, i + chunkSize);

        await Promise.all(chunk.map(async feed => {
            try {
                const res = await fetch('https://corsproxy.io?url='+feed.rss);
                const text = await res.text();
                const parser = new DOMParser();
                const xml = parser.parseFromString(text, "application/xml");

                const items = Array.from(xml.querySelectorAll("item")).slice(0, articlesPerFeed);

                for (const item of items) {
                    if (articleIndex > maxArticles) return;

                    let title = item.querySelector("title")?.textContent || "No Title";
                    let link = item.querySelector("link")?.textContent || "#";
                    let description = item.querySelector("description")?.textContent || "";

                    // Truncate description
                    if (description.length > maxDescLength) {
                        description = description.slice(0, maxDescLength) + "... read more";
                    }

                    // Try to get image from <media:content> or <enclosure>
                    let thumbnail = item.querySelector("media\\:content, enclosure")?.getAttribute("url") ||
                        "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800";

                    info.news[articleIndex++] = {
                        title,
                        content: description,
                        icon: "fa-newspaper",
                        url: link,
                        thumbnail,
                        source: feed.name,
                        category: feed.category
                    };
                }
            } catch (err) {
                console.warn("RSS failed:", feed.name, err);
            }
        }));

        // Wait between chunks to avoid overloading servers
        await new Promise(r => setTimeout(r, delayBetweenChunks));
    }

    console.log("All RSS feeds loaded directly:", info.news);
}

// ---------- Usage ----------
loadNewsFromRSS({
    categories: ["technology", "science", "business", "ai", "top", "humor", "travel", "health", "sports"],
    articlesPerFeed: 5,
    chunkSize: 3,
    delayBetweenChunks: 1500,
    maxArticles: 200,
    maxDescLength: 250
});
*/


const RSS_FEEDS = [
    // ---------- Technology ----------
    { name: "Ars Technica", rss: "http://feeds.arstechnica.com/arstechnica/index", category: "technology" },
    { name: "Hackaday", rss: "https://hackaday.com/blog/feed/", category: "technology" },
    { name: "Wired Tech", rss: "https://www.wired.com/feed/category/tech/latest/rss", category: "technology" },

    // ---------- Science ----------
    { name: "NYTimes Science", rss: "https://rss.nytimes.com/services/xml/rss/nyt/Science.xml", category: "science" },
    { name: "Wired Science", rss: "https://www.wired.com/feed/category/science/latest/rss", category: "science" },

    // ---------- Business ----------
    { name: "NYTimes Business", rss: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", category: "business" },
    { name: "Wired Business", rss: "https://www.wired.com/feed/category/business/latest/rss", category: "business" },

    // ---------- Health ----------
    { name: "NYTimes Health", rss: "https://rss.nytimes.com/services/xml/rss/nyt/Health.xml", category: "health" },

    // ---------- Sports ----------
    { name: "NYTimes Sports", rss: "https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml", category: "sports" },

    // ---------- Travel ----------
    { name: "NYTimes Travel", rss: "https://rss.nytimes.com/services/xml/rss/nyt/Travel.xml", category: "travel" },

    // ---------- General / Top ----------
    { name: "Wired Top", rss: "https://www.wired.com/feed/rss", category: "top" },
    { name: "Times of India", rss: "http://dynamic.feedsportal.com/pf/555218/http://toi.timesofindia.indiatimes.com/rssfeedstopstories.cms", category: "top" },

    // ---------- Humor / Comics ----------
    { name: "xkcd", rss: "https://xkcd.com/rss.xml", category: "humor" }
];

function getRandomizedFeeds(categories = [], maxFeeds = 6) {
    let pool = categories.length
        ? RSS_FEEDS.filter(f => categories.includes(f.category))
        : [...RSS_FEEDS];

    // Fisher-Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, maxFeeds);
}

async function loadNewsFromRSS({
    categories = ["technology", "science", "top"],
    articlesPerFeed = 10,
    maxArticles = 50
} = {}) {

    //info.news = {};
    let articleIndex = 1;

    const feeds = getRandomizedFeeds(categories, 8);

    await Promise.all(feeds.map(async feed => {
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.rss)}`;

        try {
            const res = await fetch(apiUrl);
            const data = await res.json();

            if (!data.items) return;

            const items = data.items
                .sort(() => Math.random() - 0.5) // shuffle per feed
                .slice(0, articlesPerFeed);

            for (const item of items) {
                if (articleIndex > maxArticles) return;

                const cleanDescription =
                    item.description?.replace(/<[^>]*>/g, "") || "";

                let thumbnail = item.thumbnail || item.enclosure?.link ||
                    "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800";

                info.news[articleIndex++] = {
                    title: item.title,
                    content: cleanDescription,
                    icon: "fa-newspaper",
                    url: item.link,
                    thumbnail,
                    source: feed.name,
                    category: feed.category
                };
            }

        } catch (err) {
            console.warn("RSS failed:", feed.name, err);
        }
    }));

    console.log("Loaded mixed RSS news:", info.news);
}
try{
loadNewsFromRSS({
    categories: ["technology", "science", "business", "ai"],
    articlesPerFeed: 8,
    maxArticles: 50
});}
catch(e){
    null
}
