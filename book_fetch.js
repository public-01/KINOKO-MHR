function parseData(text, url) {
    const doc = HTMLParser.parse(text);
    const titleNode = doc.querySelector('.detail-main-info-title');
    const summaryNode = doc.querySelector('.detail-desc');
    const authorNode = doc.querySelector('.detail-main-info-author');
    const chapterNodes = doc.querySelectorAll('#tempc a.chapteritem');
    const chapters = [];
    for (const node of chapterNodes) {
        const href = node.getAttribute('href');
        if (!href) continue;
        chapters.push({
            title: node.text.trim(),
            subtitle: node.getAttribute('title') || '',
            link: new URL(href, url).toString()
        });
    }
    if (chapters.length === 0) {
        for (const node of doc.querySelectorAll('.detail-list-1 a[href^="/m"]')) {
            const href = node.getAttribute('href');
            if (href) chapters.push({
                title: node.text.trim(),
                subtitle: node.getAttribute('title') || '',
                link: new URL(href, url).toString()
            });
        }
    }
    return {
        title: titleNode ? titleNode.text.trim() : '',
        subtitle: authorNode ? authorNode.text.trim() : '',
        summary: summaryNode ? summaryNode.text.trim() : '',
        list: chapters.reverse()
    };
}

module.exports = async function(url) {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        }
    });
    if (!res.ok) throw new Error(`Could not load manga details (${res.status}): ${url}`);
    return parseData(await res.text(), url);
};
