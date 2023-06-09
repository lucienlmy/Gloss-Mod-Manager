import { createApp } from 'vue'
import App from '@src/App.vue'
import '@src/samples/node-api'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import '@src/assets/main.less'

import { vuetify } from '@src/plugins/vuetify'

import router from '@src/router'
import { createPinia } from 'pinia'
import i18n from '@src/lang'

const app = createApp(App)
app.use(router)
app.use(vuetify)
app.use(i18n)
app.use(createPinia())

app.use(ElementPlus, { size: 'small', zIndex: 3000 })
app.mount('#app')
    .$nextTick(() => {
        postMessage({ payload: 'removeLoading' }, '*')
    })
