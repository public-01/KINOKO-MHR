function listTabs(title, id, routes) {
    return {
        title: title,
        subtabs: [
            { title: '最近更新', id: `${id}-update`, url: `https://www.manhuaren.com${routes.update}` },
            { title: '最熱門', id: `${id}-hot`, url: `https://www.manhuaren.com${routes.hot}` },
            { title: '最新上架', id: `${id}-new`, url: `https://www.manhuaren.com${routes.new}` }
        ]
    };
}

class IndexController extends Controller {
    load() {
        this.data = {
            tabs: [
                listTabs('日漫', 'jpkr', {
                    update: '/manhua-list-area36-s2/',
                    hot: '/manhua-jpkr/',
                    new: '/manhua-list-area36-s18/'
                }),
                listTabs('全部', 'all', {
                    update: '/manhua-list-s2/',
                    hot: '/manhua-list/',
                    new: '/manhua-list-s18/'
                }),
                listTabs('原創精品', 'original', {
                    update: '/manhua-list-s2/',
                    hot: '/manhua-original/',
                    new: '/manhua-list-s18/'
                }),
                listTabs('完結', 'completed', {
                    update: '/manhua-list-st2-s2/',
                    hot: '/manhua-list-st2/',
                    new: '/manhua-list-st2-s18/'
                })
            ]
        };
    }
}

module.exports = IndexController;
