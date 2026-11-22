const checkResponse = require('./http');
const PER_PAGE = 21;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

class MainController extends Controller {
    load(data) {
        this.id = data.id;
        this.url = data.url;
        this.page = 1;
        this.params = null;
        this.data = {
            list: [],
            loading: false,
            hasMore: true
        };
        this.reload();
    }

    async fetchPage(url) {
        const res = await fetch(url, {
            headers: { 'User-Agent': USER_AGENT }
        });
        checkResponse(res, 'Request failed', url);
        return await res.text();
    }

    async reload() {
        this.setState(() => { this.data.loading = true; });
        try {
            const text = await this.fetchPage(this.url);
            const items = this.parseData(text, this.url);
            if (items.length === 0) throw new Error('No manga items found on the page');
            this.params = this.parseParams(text);
            this.page = 1;
            localStorage[`cache_${this.id}`] = JSON.stringify({
                time: new Date().getTime(),
                items: items
            });
            this.setState(() => {
                this.data.list = items;
                this.data.loading = false;
                this.data.hasMore = true;
            });
        } catch (e) {
            showToast(`${e}\n${e.stack}`);
            this.setState(() => { this.data.loading = false; });
        }
    }

    async onLoadMore() {
        if (!this.params) return;
        this.setState(() => { this.data.loading = true; });
        try {
            const params = this.params;
            const body = [
                ['action', 'getclasscomics'],
                ['pageindex', this.page + 1],
                ['pagesize', params.pagesize],
                ['categoryid', params.categoryid],
                ['tagid', params.tagid],
                ['status', params.status],
                ['usergroup', params.usergroup],
                ['pay', params.pay],
                ['areaid', params.areaid],
                ['sort', params.sort],
                ['iscopyright', params.iscopyright]
            ].map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');
            const endpoint = new URL(`dm5.ashx?d=${new Date().getTime()}`, this.url).toString();
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'User-Agent': USER_AGENT,
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Origin': 'https://www.manhuaren.com',
                    'Referer': this.url
                },
                body: body
            });
            checkResponse(res, 'Request failed', endpoint);
            const json = await res.json();
            let responseItems = null;
            if (json && Array.isArray(json.UpdateComicItems)) {
                responseItems = json.UpdateComicItems;
            } else if (json && Array.isArray(json.items)) {
                responseItems = json.items;
            } else if (json && json.Count === 0 && json.items === null) {
                responseItems = [];
            } else {
                throw new Error('Unexpected manga-list response');
            }
            const items = responseItems.map(item => {
                if (!item || !item.UrlKey || !item.Title || !item.ShowPicUrlB) return null;
                return {
                    title: item.Title,
                    link: new URL(`/${item.UrlKey}/`, this.url).toString(),
                    picture: new URL(item.ShowPicUrlB, this.url).toString(),
                    pictureHeaders: { Referer: this.url },
                    subtitle: `${Number(item.Status) === 1 ? '完結' : '最新'} ${item.ShowLastPartName || ''}`.trim()
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

    parseParams(text) {
        function read(name, fallback) {
            const match = text.match(new RegExp(`\\b${name}\\s*=\\s*["']?([^;"'\\s]+)`));
            return match ? match[1] : fallback;
        }
        return {
            pagesize: Number(read('pagesize', PER_PAGE)),
            categoryid: read('categoryid', '0'),
            tagid: read('tagid', '0'),
            status: read('status', '0'),
            usergroup: read('usergroup', '0'),
            pay: read('pay', '-1'),
            areaid: read('areaid', '0'),
            sort: read('sort', '2'),
            iscopyright: read('iscopyright', 'False').toLowerCase() === 'true' ? '1' : '0'
        };
    }

    parseData(text, url) {
        const doc = HTMLParser.parse(text);
        const nodes = doc.querySelectorAll('.manga-list-2 li');
        const items = [];
        for (const node of nodes) {
            const linkNode = node.querySelector('.manga-list-2-cover a');
            const image = node.querySelector('.manga-list-2-cover-img');
            const titleNode = node.querySelector('.manga-list-2-title a');
            const subtitleNode = node.querySelector('.manga-list-2-tip a');
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

    async onPressed(index) {
        await this.navigateTo('book', { data: this.data.list[index] });
    }

    onRefresh() {
        this.reload();
    }
}

module.exports = MainController;
