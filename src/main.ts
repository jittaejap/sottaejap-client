import '@/assets/styles/index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from '@/App.vue'
import router from '@/router'
import { lockZoomGestures } from '@/utils/zoomLock'

// 화면·라우트와 무관한 문서 전역 동작이라 컴포넌트 생명주기가 아니라 부팅 시점에 한 번 건다.
lockZoomGestures()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
