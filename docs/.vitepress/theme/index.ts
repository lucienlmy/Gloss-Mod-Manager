import { h } from 'vue';
import Theme from 'vitepress/theme';
import FriendlyLinks from './components/FriendlyLinks.vue';

export default {
    ...Theme,
    Layout() {
        return h(Theme.Layout, null, {
            'layout-bottom': () => h(FriendlyLinks),
        });
    },
};