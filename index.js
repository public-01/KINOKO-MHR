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

const genreTabs = [
    { title: '熱血', slug: 'rexue', tagId: 31 },
    { title: '戀愛', slug: 'aiqing', tagId: 26 },
    { title: '校園', slug: 'xiaoyuan', tagId: 1 },
    { title: '偽娘', slug: 'weiniang', tagId: 5 },
    { title: '冒險', slug: 'maoxian', tagId: 2 },
    { title: '職場', slug: 'zhichang', tagId: 6 },
    { title: '後宮', slug: 'hougong', tagId: 8 },
    { title: '治癒', slug: 'zhiyu', tagId: 9 },
    { title: '科幻', slug: 'kehuan', tagId: 25 },
    { title: '輕小說', slug: 'qingxiaoshuo1', tagId: 156 },
    { title: '勵志', slug: 'lizhi', tagId: 10 },
    { title: '生活', slug: 'shenghuoqinqing', tagId: 11 },
    { title: '戰爭', slug: 'zhanzheng', tagId: 12 },
    { title: '懸疑', slug: 'xuanyi', tagId: 17 },
    { title: '推理', slug: 'zhentan', tagId: 33 },
    { title: '搞笑', slug: 'gaoxiao', tagId: 37 },
    { title: '奇幻', slug: 'qihuan', tagId: 14 },
    { title: '魔法', slug: 'mofa', tagId: 15 },
    { title: '神鬼', slug: 'dongfangshengui', tagId: 20 },
    { title: '萌系', slug: 'mengxi', tagId: 21 },
    { title: '歷史', slug: 'lishi', tagId: 4 },
    { title: '美食', slug: 'meishi', tagId: 7 },
    { title: '同人', slug: 'tongren', tagId: 30 },
    { title: '運動', slug: 'jingji', tagId: 34 },
    { title: '紳士', slug: 'jiecao', tagId: 36 },
    { title: '機甲', slug: 'jizhan', tagId: 40 }
];

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
                }),
                listTabs('限制級', 'tag-61', {
                    update: '/manhua-list-tag61-s2/',
                    hot: '/manhua-list-tag61/',
                    new: '/manhua-list-tag61-s18/'
                }),
                ...genreTabs.map(genre => listTabs(genre.title, `tag-${genre.tagId}`, {
                    update: `/manhua-list-tag${genre.tagId}-s2/`,
                    hot: `/manhua-${genre.slug}/`,
                    new: `/manhua-list-tag${genre.tagId}-s18/`
                }))
            ]
        };
    }
}

module.exports = IndexController;
