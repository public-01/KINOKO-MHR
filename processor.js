const checkResponse = require('./http');
const USER_AGENT = 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';

function readPackedString(source, position) {
    while (/\s/.test(source[position])) position++;
    const quote = source[position++];
    if (quote !== "'" && quote !== '"') throw new Error('Invalid packed manga script');
    let value = '';
    while (position < source.length) {
        const char = source[position++];
        if (char === quote) return { value: value, position: position };
        if (char !== '\\') {
            value += char;
            continue;
        }
        const escaped = source[position++];
        if (escaped === 'n') value += '\n';
        else if (escaped === 'r') value += '\r';
        else if (escaped === 't') value += '\t';
        else if (escaped === 'b') value += '\b';
        else if (escaped === 'f') value += '\f';
        else if (escaped === 'u' || escaped === 'x') {
            const count = escaped === 'u' ? 4 : 2;
            value += String.fromCharCode(parseInt(source.substr(position, count), 16));
            position += count;
        } else value += escaped;
    }
    throw new Error('Unterminated packed manga script string');
}

function unpack(script) {
    const call = script.indexOf('}(');
    if (call < 0) return script;
    let position = call + 2;
    const payload = readPackedString(script, position);
    position = payload.position;
    let match = script.substr(position).match(/^\s*,\s*(\d+)\s*,\s*(\d+)\s*,/);
    if (!match) return script;
    const radix = Number(match[1]);
    const count = Number(match[2]);
    position += match[0].length;
    const dictionary = readPackedString(script, position);
    const words = dictionary.value.split('|');
    let result = payload.value;
    for (let index = count - 1; index >= 0; index--) {
        const word = words[index];
        if (!word) continue;
        const token = index.toString(radix).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        result = result.replace(new RegExp(`\\b${token}\\b`, 'g'), () => word);
    }
    return result;
}

function imageUrlsFromPage(text) {
    const doc = HTMLParser.parse(text);
    const scripts = doc.querySelectorAll('script:not([src])');
    for (const scriptNode of scripts) {
        const source = scriptNode.text.trim();
        if (!source || (!source.includes('newImgs') && !source.includes('imgData'))) continue;
        let decoded = source;
        if (source.includes('eval(function')) {
            try {
                decoded = unpack(source);
            } catch (e) {
                console.log(`Could not decode packed chapter script: ${e}`);
            }
        }
        if (!decoded.includes('newImgs')) continue;
        let urls = decoded.match(/https?:\/\/[^"'\\\s]+/g) || [];
        if (urls.length > 0) return urls;

        const context = new ScriptContext();
        context.eval(source);
        const result = context.eval('JSON.stringify(newImgs)');
        if (typeof result === 'string') {
            urls = JSON.parse(result);
            if (Array.isArray(urls) && urls.length > 0) return urls;
        }
    }
    throw new Error('Could not find manga page image URLs');
}

class MangaProcessor extends Processor {
    get key() {
        return this.data.link;
    }

    async load(state) {
        try {
            const url = this.data.link;
            const res = await fetch(url, {
                headers: {
                    'User-Agent': USER_AGENT,
                    'Referer': 'https://www.manhuaren.com/'
                }
            });
            checkResponse(res, 'Could not load chapter', url);
            const images = imageUrlsFromPage(await res.text()).map(image => ({
                url: image,
                headers: {
                    'User-Agent': USER_AGENT,
                    'Referer': url
                }
            }));
            this.setData(images);
            this.save(true, state);
        } catch (e) {
            console.log(`Manhuaren download failed: ${e}\n${e.stack}`);
            showToast(`漫畫人章節圖片載入失敗：${e}`);
            throw e;
        } finally {
            this.loading = false;
        }
    }

    async checkNew() {
        const data = await require('./book_fetch')(this.data.link);
        const chapter = data.list[data.list.length - 1];
        if (!chapter) throw new Error('No chapters found for this manga');
        return { title: chapter.title, key: chapter.link };
    }

    unload() {}
}

module.exports = MangaProcessor;
