import {createRouter as _createRouter, createWebHistory} from 'vue-router';

//const pages = import.meta.glob('../src/**/*.vue',{as: 'raw',eager: true});
const About = { template: '<div>About</div>' }
//for (const path in pages) {
//    routes.push({path:path,component:pages[path]})
//}
import home from '../App.vue'
const routes = [
    { path: '/', component: home },
    { path: '/about', component: About },
  ]

export function createRouter() {
    return _createRouter({
        history: createWebHistory(),
        routes
    })
}