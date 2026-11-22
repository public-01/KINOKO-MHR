const checkResponse = require('./http');
const BASE_URL = 'https://www.manhuaren.com/';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

class SearchController extends Controller {
    load(data) {
        let hints = [];
        const saved = localStorage['manhuaren_search_hints'];
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) hints = parsed;
        }
        this.page = 1;
        this.data = {
            list: [],
            focus: false,
            hints: hints,
            text: data && data.query ? data.query : '',
            loading: false,
            hasMore: false
        };
        if (this.data.text) this.onTextSubmit(this.data.text);
    }

    onSearchClicked() {
        this.findElement('input').submit();
    }

    onTextChange(text) {
        this.data.text = text;
    }

    async onTextSubmit(text) {
        text = (text || '').trim();
        if (!text) return;
        this.query = text;
        this.setState(() => {
            this.data.text = text;
            this.data.loading = true;
            this.data.focus = false;
            const index = this.data.hints.indexOf(text);
            if (index >= 0) this.data.hints.splice(index, 1);
            this.data.hints.unshift(text);
            while (this.data.hints.length > 30) this.data.hints.pop();
            localStorage['manhuaren_search_hints'] = JSON.stringify(this.data.hints);
        });
        try {
            const url = `${BASE_URL}search?title=${encodeURIComponent(text)}&language=1&f=2`;
            const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
            checkResponse(res, 'Search failed', url);
            const html = await res.text();
            const items = this.parseData(html, url);
            this.page = 1;
            this.setState(() => {
                this.data.list = items;
                this.data.loading = false;
                this.data.hasMore = items.length > 0;
            });
        } catch (e) {
            showToast(`${e}\n${e.stack}`);
            this.setState(() => { this.data.loading = false; });
        }
    }

    parseData(html, url) {
        const doc = HTMLParser.parse(html);
        const items = [];
        for (const node of doc.querySelectorAll('.book-list li')) {
            const linkNode = node.querySelector('.book-list-cover a');
            const image = node.querySelector('.book-list-cover-img');
            const titleNode = node.querySelector('.book-list-info-title');
            const subtitleNode = node.querySelector('.book-list-info-bottom');
            if (!linkNode || !image || !titleNode) continue;
            const link = linkNode.getAttribute('href');
            const picture = image.getAttribute('src') || image.getAttribute('data-src');
            if (!link || !picture) continue;
            items.push({
                title: titleNode.text.trim(),
                link: new URL(link, url).toString(),
                picture: new URL(picture, url).toString(),
                pictureHeaders: { Referer: url },
                subtitle: subtitleNode ? subtitleNode.text.trim() : ''
            });
        }
        return items;
    }

    async onLoadMore() {
        if (!this.query || !this.data.hasMore) return;
        this.setState(() => { this.data.loading = true; });
        try {
            const body = [
                ['t', '7'],
                ['pageindex', this.page + 1],
                ['f', '0'],
                ['title', this.query]
            ].map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
            const url = `${BASE_URL}pagerdata.ashx?d=${encodeURIComponent(new Date().toString())}`;
            const referer = `${BASE_URL}search?title=${encodeURIComponent(this.query)}&language=1&f=2`;
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'User-Agent': USER_AGENT,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Origin': 'https://www.manhuaren.com',
                    'Referer': referer
                },
                body: body
            });
            checkResponse(res, 'Search paging failed', url);
            const responseText = await res.text();
            if (!responseText.trim()) throw new Error(`Search paging returned an empty response: ${url}`);
            const data = JSON.parse(responseText);
            if (!Array.isArray(data)) throw new Error('Unexpected search response');
            const items = data.map(item => {
                if (!item || !item.Url || !item.Title || !item.Pic) return null;
                return {
                    title: item.Title,
                    link: new URL(item.Url, BASE_URL).toString(),
                    picture: new URL(item.Pic, BASE_URL).toString(),
                    pictureHeaders: { Referer: BASE_URL },
                    subtitle: `${item.Categorys || ''} ${item.Status || ''}`.trim()
                };
            }).filter(item => item !== null);
            this.page++;
            this.setState(() => {
                this.data.list.push(...items);
                this.data.loading = false;
                this.data.hasMore = items.length > 0;
            });
        } catch (e) {
            showToast(`${e}\n${e.stack}`);
            this.setState(() => { this.data.loading = false; });
        }
    }

    async onPressed(index) {
        await this.navigateTo('book', { data: this.data.list[index] });
    }

    onHintPressed(index) {
        const hint = this.data.hints[index];
        if (!hint) return;
        this.findElement('input').blur();
        this.onTextSubmit(hint);
    }

    onTextFocus() {
        this.setState(() => { this.data.focus = true; });
    }

    onTextBlur() {
        this.setState(() => { this.data.focus = false; });
    }

    onRefresh() {
        if (this.query) this.onTextSubmit(this.query);
    }
}

module.exports = SearchController;
