<template>
<div style="height: 100%;width: 100%;">
    <div data-color-mode="light" data-light-theme="light" class="p-0">
        <div class="Header" style="margin-top: 0px;margin-bottom: 0px;width: 100%;">
            <div class="Header-item">
                <a href="#" class="Header-link f4 d-flex flex-items-center">
                    <!-- <%= octicon "mark-github", class: "mr-2", height: 32 %> -->
                    <svg height="32" class="octicon octicon-mark-github mr-2" viewBox="0 0 16 16" version="1.1" width="32" aria-hidden="true">
                        <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
                    </svg>
                    <span>xqy2006</span>
                </a>
            </div>
        </div>
        <div class="Layout" style="margin-top: 30px;margin-inline-start: 50px;margin-inline-end: 50px;">
            <div class="Layout-main">
                <div class="Box Box--blue">
                    <div class="Box-header d-flex flex-items-center">
                        <h3 class="Box-title overflow-hidden flex-auto">
                            {{context(get_mdlist()).name}}
                            <span class="Label mr-1 Label--accent" style="margin-inline-start: 5px;">{{context(get_mdlist()).tag}}</span>
                        </h3>

                        <button class="btn btn-primary btn-sm" @click="goback()">
                            返回首页
                        </button>
                    </div>
                    <div class="Box-body">
                        <div class="markdown-body">
                            <div v-html="context(get_mdlist()).content">
                            </div>
                        </div>
                    </div>
                    <div class="Box-footer">
                        © 2022 xqy2006
                    </div>
                </div>
            </div>

            <div class="Layout-sidebar">
                <nav class="menu" aria-label="Person settings">
                    <span class="menu-heading" id="menu-heading">目录</span>
                    <a v-for="o in get_mdlist()" :key="o" class="menu-item" :href="`#`+o.name" :aria-selected="aria(o.name)">
                        {{o.name}}<span class="Label mr-1 Label--accent" style="margin-inline-start: 5px;">{{o.tag}}</span></a>
                </nav>
            </div>
        </div>

    </div>
</div>
</template>

<style lang="scss">
@import "@primer/css/index.scss";

html,
body {
    width: 100%;
    height: 100%;
    margin: 0;
}
</style>

<script>
import MarkdownIt from 'markdown-it';
//import indexmd from './assets/xqy2006_blog.md?raw'
export default {
    data() {
        return {
            result: '',
            filename: '',
            mdlist: [],
        }
    },
    created() {
        window.onhashchange = function (event) {
            location.reload()
        }
    },
    methods: {
        get_mdlist() {
            const md = new MarkdownIt();
            const markdown =
                import.meta.glob('./assets/**/*.md', {
                    as: 'raw',
                    eager: true
                })
            const mdlist = []
            for (const path in markdown) {

                let mds = markdown[path]
                //console.log(markdown)
                //console.log(path.substring(path.lastIndexOf('/')+1), mds)
                mdlist.push({
                    name: path.substring(path.lastIndexOf('/') + 1),
                    content: md.render(mds),
                    tag: path.slice(0, path.lastIndexOf('/')).substring(path.slice(0, path.lastIndexOf('/')).lastIndexOf('/') + 1).substring(2)
                })
                console.log(mdlist)
            }
            //console.log(test);
            //console.log(indexmd)
            //console.log(mdlist.length)
            //this.result = md.render(indexmd);
            //this.filename = 'xqy2006_blog.md'
            return mdlist
        },
        aria(name) {
            if ("#" + name == decodeURI(location.hash)) {
                return 'true'
            } else {
                //console.log("#" + name + '\n' + location.hash)
                return 'false'
            }
        },
        context(mdlist) {
            console.log(mdlist)
            for (let item of mdlist) {
                console.log(item.name, decodeURI(location.hash))
                if ("#" + item.name == decodeURI(location.hash)) {
                    return {
                        name: item.name,
                        content: item.content,
                        tag: item.tag,
                    }
                }
            }
            return {
                name: "error",
                content: "error",
                tag: "error",
            }
        },
        goback() {
            location.hash = '#xqy2006_blog.md'
        }
    },
}
</script>
