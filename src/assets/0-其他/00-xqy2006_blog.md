# 欢迎来到xqy2006的Blog
> 一个仿GitHub风格的博客

代码已开源：[https://github.com/xqy2006/xqy2006.github.io/](https://github.com/xqy2006/xqy2006.github.io/)

### 技术栈

主要技术：

- Vue 3
- Vite 3
- Primer CSS
- scss
- Prettier 美化代码

依赖库：

- markdown-it 解析Markdown文件
- highlight.js 代码高亮

### 食用方法

1. 安装

   ① 将源码克隆到本地

   ② 安装包管理器npm

   ③ 在源码根目录运行`npm install -i`安装依赖项

   ④ 运行`npm run dev`在本地查看效果

   ⑤ 确认运行正常后运行`npm run build`构建(Vercel平台可跳过这步，直接上传源码)

   ⑥ 将`dist`目录生成的静态文件上传至静态网页托管平台(GitHub Pages、Vercel......)

2. 写作

   ① 新建标签：

   在源码的`./src/assets`目录下新建文件夹，文件夹的名称为`x-标签名称`，其中x的大小代表了标签的排列顺序，越小在列表的排序更靠前

   ② 新建博文

   博文使用Markdown语法，网页将只会读取文件后缀名为`.md`的文件，在相应的标签文件夹下放入博文的Markdown文件，文件名为`xx-文章名称`，其中xx的大小代表了标签的排列顺序，越小在列表的排序更靠前



- 主要代码

  主要代码将放在这里，方便上不去GitHub的朋友观看：

```html
<template>
<div style="height: 100%;width: 100%;">
    <div data-color-mode="light" data-light-theme="light" class="p-0">
        <div class="Header" style="margin-top: 0px;margin-bottom: 0px;width: 100%;">
            <div class="Header-item">
                <a @click="goback()" class="Header-link f4 d-flex flex-items-center">
                    <!-- <%= octicon "mark-github", class: "mr-2", height: 32 %> -->
                    <svg height="32" class="octicon octicon-mark-github mr-2" viewBox="0 0 16 16" version="1.1" width="32" aria-hidden="true">
                        <path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
                    </svg>
                    <span>xqy2006</span>
                </a>
            </div>
            <div class="Header-item">
                <a href="music_generation" target="_blank" class="Header-link">音乐生成</a>
            </div>
            <div class="Header-item">
                <a href="xqy-markdown" target="_blank" class="Header-link">Markdown编辑器</a>
            </div>
            <div class="Header-item">
                <a href="identicon" target="_blank" class="Header-link">GitHub头像生成器</a>
            </div>
            <div class="Header-item">
                <a href="draw" target="_blank" class="Header-link">Excalidraw</a>
            </div>
        </div>
        <div class="Layout" :style="{'margin-top': '30px','margin-inline-start': isMobileDevice(),'margin-inline-end': isMobileDevice(),}">
            <div class="Layout-main">
                <div class="Box Box--blue">
                    <div class="Box-header d-flex flex-items-center">
                        <h3 class="Box-title overflow-hidden flex-auto">
                            {{nam}}
                            <span class="Label mr-1 Label--accent" style="margin-inline-start: 5px;">{{context(get_mdlist()).tag}}</span>
                        </h3>

                        <button class="btn btn-primary btn-sm" @click="goback()">
                            返回首页
                        </button>
                    </div>
                    <div class="Box-body">
                        <div class="markdown-body">
                            <div v-html="con">
                            </div>
                        </div>
                    </div>
                    <div class="Box-footer d-flex flex-items-center">
                        <h3 class="Box-title overflow-hidden flex-auto">
                            © 2022 xqy2006
                        </h3>
                        <button class="btn btn-primary btn-sm" @click="gotop()">回到顶部</button>
                    </div>
                </div>
            </div>

            <div class="Layout-sidebar">
                <nav class="menu" aria-label="Person settings">
                    <span class="menu-heading" id="menu-heading">目录</span>
                    <a v-for="o in get_mdlist()" :key="o" class="menu-item" @click="pagechange(o.name)" :aria-selected="aria(o.name)">
                        {{o.name}}<span class="Label mr-1 Label--accent" style="margin-inline-start: 5px;">{{o.tag}}</span></a>
                </nav>
            </div>
        </div>

    </div>
</div>
</template>

<style lang="scss">
@import "@primer/css/index.scss";
@import "highlight.js/styles/github.css";
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
import hljs from 'highlight.js/lib/common';
export default {
    data() {
        return {
            result: '',
            filename: '',
            mdlist: [],
            con:this.context(this.get_mdlist()).content,
            nam:this.context(this.get_mdlist()).name,
        }
    },
    created() {
        //window.onhashchange = function (event) {
        //    location.reload()
        //}
        //if (location.hash == '') {
        //    location.hash = '#xqy2006_blog.md'
        //}
        sessionStorage.setItem('hash','xqy2006_blog.md');
        this.con = this.context(this.get_mdlist()).content
        this.nam = this.context(this.get_mdlist()).name
    },
    methods: {
        get_mdlist() {
            const md = MarkdownIt({
                html: true,
                linkify: true,
                breaks: true,
                highlight: function (str, lang) {
                    if (lang && hljs.getLanguage(lang)) {
                        try {
                            return hljs.highlight(str, {
                                language: lang
                            }).value;
                        } catch (__) {}
                    }

                    return ''; // use external default escaping
                }
            });
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
                    name: path.substring(path.lastIndexOf('/') + 1).substring(3),
                    content: md.render(mds),
                    tag: path.slice(0, path.lastIndexOf('/')).substring(path.slice(0, path.lastIndexOf('/')).lastIndexOf('/') + 1).substring(2)
                })
                //console.log(mdlist)
            }
            //console.log(test);
            //console.log(indexmd)
            //console.log(mdlist.length)
            //this.result = md.render(indexmd);
            //this.filename = 'xqy2006_blog.md'
            return mdlist
        },
        aria(name) {
            if (name == sessionStorage.getItem('hash')) {
                return 'true'
            } else {
                //console.log("#" + name + '\n' + location.hash)
                return 'false'
            }
        },
        context(mdlist) {
            //console.log(mdlist)
            for (let item of mdlist) {
                //console.log(item.name, decodeURI(location.hash))
                if (item.name == sessionStorage.getItem('hash')) {
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
            sessionStorage.setItem('hash','xqy2006_blog.md');
            this.con = this.context(this.get_mdlist()).content
            this.nam = this.context(this.get_mdlist()).name
        },
        gotop() {
            document.body.scrollTop = 0
            document.documentElement.scrollTop = 0
        },
        pagechange(name){
            sessionStorage.setItem('hash',name);
            this.con = this.context(this.get_mdlist()).content
            this.nam = this.context(this.get_mdlist()).name
        },
        isMobileDevice() { //判断当前设备是否为移动端
            const ua = navigator.userAgent.toLowerCase();
            const t1 = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
                ua
            );
            const t2 = !ua.match("iphone") && navigator.maxTouchPoints > 1;
            if (t1 || t2) {
                return "5px"
            } else {
                return "50px"
            }
        },
    },
}
</script>

```

  



