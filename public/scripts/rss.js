
// add yahoo rss

function loadNewsFromBingRSS(query = 'tech') {
    // 1. Setup Bing RSS URL
    //const bingRss = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&count=20`;
    const bingRss = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&count=200`
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(bingRss)}`;

    fetch(apiUrl)
        .then(res => res.json())
        .then(async data => {
            info.news = {}; // reset news

            // Limit to 6 articles
            const items = data.items.slice(0, 50);

            await Promise.all(items.map(async (item, index) => {
                // Decode the real URL from Bing's redirect
                let decodedUrl = item.link;
                try {
                    const urlParams = new URLSearchParams(new URL(item.link).search);
                    if (urlParams.has('url')) decodedUrl = urlParams.get('url');
                } catch (e) {
                    console.warn("Could not decode Bing link, using original.");
                }

                // Fetch thumbnail via Microlink
                let thumbnail = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2670'; // fallback
                try {
                    const metaRes = await fetch(`https://api.microlink.io?url=${encodeURIComponent(decodedUrl)}`);
                    const metaData = await metaRes.json();
                    if (metaData.data.image?.url) thumbnail = metaData.data.image.url;
                } catch (err) {
                    console.warn("Microlink failed for", decodedUrl);
                }

                // Strip HTML from description
                const cleanDescription = item.description.replace(/<[^>]*>?/gm, "");

                // Save to info.news
                info.news[index + 1] = {
                    title: item.title,
                    content: cleanDescription,
                    icon: 'fa-newspaper',
                    url: decodedUrl,
                    thumbnail: thumbnail
                };
            }));

            console.log("Loaded news:", info.news);
        })
        .catch(err => console.error("Failed to fetch Bing RSS:", err));
}

function closeApp(app) {
    app.classList.remove('open');
    app.classList.add('closing');

    setTimeout(() => {
        app.classList.remove('closing');
        app.classList.add('closed');
    }, 300);
}


// Load news when page starts
loadNewsFromBingRSS();
