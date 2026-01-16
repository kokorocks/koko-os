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

    info.news = {};
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

loadNewsFromRSS({
    categories: ["technology", "science", "business", "ai"],
    articlesPerFeed: 8,
    maxArticles: 50
});