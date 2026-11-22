const bookFetch = require('./book_fetch');

class BookController extends Controller {
    get bookInfo() {
        return {
            key: this.url,
            title: this.data.title,
            subtitle: this.data.subtitle,
            picture: this.data.picture,
            page: 'book',
            data: {
                link: this.url,
                title: this.data.title,
                subtitle: this.data.subtitle,
                picture: this.data.picture,
                summary: this.data.summary
            }
        };
    }

    load(data) {
        this.url = data.link;
        this.data = {
            title: data.title,
            subtitle: data.subtitle || '',
            summary: data.summary || '',
            picture: data.picture,
            pictureHeaders: { Referer: this.url },
            loading: false,
            editing: false,
            reverse: localStorage['reverse'] != 'false',
            list: []
        };
        this.selected = [];
        this.addHistory(this.bookInfo);

        const cached = localStorage[`book:${this.url}`];
        if (cached) {
            const saved = JSON.parse(cached);
            if (saved.title) this.data.title = saved.title;
            if (saved.subtitle) this.data.subtitle = saved.subtitle;
            if (saved.summary) this.data.summary = saved.summary;
            if (Array.isArray(saved.list)) this.data.list = saved.list;
            if (new Date().getTime() - (saved.time || 0) > 30 * 60 * 1000) this.reload();
        } else {
            this.reload();
        }
        FavoritesManager.clearNew(this.url);
        this.data.last = this.getLast();
    }

    onRefresh() {
        this.reload();
    }

    async reload() {
        this.setState(() => { this.data.loading = true; });
        try {
            const data = await bookFetch(this.url);
            data.time = new Date().getTime();
            data.version = 1;
            data.title = this.data.title;
            localStorage[`book:${this.url}`] = JSON.stringify(data);
            this.setState(() => {
                if (data.subtitle) this.data.subtitle = data.subtitle;
                this.data.summary = data.summary;
                this.data.list = data.list;
                this.data.loading = false;
                this.data.last = this.getLast();
            });
        } catch (e) {
            showToast(`${e}\n${e.stack}`);
            this.setState(() => { this.data.loading = false; });
        }
    }

    onSourcePressed() {
        this.openBrowser(this.url);
    }

    onFavoritePressed() {
        this.setState(() => {
            if (this.isFavarite()) {
                FavoritesManager.remove(this.url);
            } else {
                let last;
                if (this.data.list.length > 0) {
                    const item = this.data.list[this.data.list.length - 1];
                    last = { title: item.title, key: item.link };
                }
                this.addFavorite(this.bookInfo, last);
            }
        });
    }

    onDownloadPressed() {
        this.setState(() => { this.data.editing = true; });
    }

    onClearPressed() {
        this.selected = [];
        this.setState(() => { this.data.editing = false; });
    }

    onCheckPressed() {
        const downloads = this.selected.map(index => {
            const item = this.data.list[index];
            return {
                key: item.link,
                title: this.data.title,
                link: this.url,
                picture: this.data.picture,
                subtitle: this.data.subtitle,
                data: item
            };
        });
        this.addDownload(downloads);
        this.selected = [];
        this.setState(() => { this.data.editing = false; });
    }

    async onPressed(index) {
        if (this.data.editing) {
            this.setState(() => {
                const position = this.selected.indexOf(index);
                if (position >= 0) this.selected.splice(position, 1);
                else this.selected.push(index);
            });
            return;
        }
        await this.openBook({ key: this.url, list: this.data.list, index: index });
        this.setState(() => { this.data.last = this.getLast(); });
    }

    async onLastPressed() {
        const key = this.getLastKey(this.url);
        const index = this.data.list.findIndex(item => item.link === key);
        if (index >= 0) await this.onPressed(index);
    }

    onOrderSelected(value) {
        this.setState(() => {
            this.data.reverse = value;
            localStorage['reverse'] = value.toString();
        });
    }

    isSelected(index) {
        return this.selected.indexOf(index) >= 0;
    }

    isDownloaded(index) {
        return DownloadManager.exist(this.data.list[index].link);
    }

    isFavarite() {
        return FavoritesManager.exist(this.url);
    }

    getLast() {
        const key = this.getLastKey(this.url);
        const chapter = this.data.list.find(item => item.link === key);
        return chapter ? chapter.title : null;
    }
}

module.exports = BookController;
