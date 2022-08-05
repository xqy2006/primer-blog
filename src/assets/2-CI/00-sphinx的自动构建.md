# sphinx的自动构建

#### 1. 一些说明

​		想找个地方记录一下，看到许多python项目的文档是用sphinx写的，用一些平台托管自己的文档感觉不太自由，于是打算自己搭建一个。由于sphinx构建生成的都是静态页面，因此可以使用Github Pages托管。

​		如果每次都在本地修改项目源码，然后本地构建，再将源代码上传至Github备份，静态页面部署至Github Pages，不免觉得有些麻烦，偶然间发现了Github Action功能（~~这不是直接白嫖服务器吗~~），使用Github Action进行构建和部署，这样我只需要将初始源代码上传至Github，然后想要修改或写文章的时候直接在Github上改。然后全自动更新Github Pages，并且可以随时回滚版本。

#### 2. 一些坑

​		① 在Github Marketplace上搜到的sphinx自动构建的Acition大多都不能使用或版本老旧（需要修改许多地方），并且所有都不支持markdown（需要加装个库）

​		② 使用Github Pages默认的jekyll会导致sphinx构建的js与css无法访问（因为jekyll会不会使用\_开头的文件/文件夹，而sphinx构建的js与css存放在_static中），因此需要禁用jekyll

​		③ sphinx几个库的版本要注意（之前因为版本直接不兼容导致搜索功能无法使用）

​		④ latex也是坑，为了支持pdf下载，不得不倒腾latex，pdflatex不支持中文，xelatex会因为我的badge未设置大小而报错，最终删除badge使用xelatex

#### 3. 主要代码

sphinx项目文件放入docs目录下

/.github/workflows/Build&Deploy.yml——启动

```yaml
name: Build&Deploy
on:
  pull_request:
    branches: [ master ]
  workflow_dispatch:
  push:
    branches:
      - master
jobs:
  build-Github:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      # Setup Conda
      - uses: conda-incubator/setup-miniconda@v2
        with:
          python-version: 3.7
      # Runs this action
      - uses: ./
        with:
          package_name: 'other_example'
      - uses: actions/download-artifact@v2
      - name: Check Artifacts
        run: |
          ls -al
          if [ ! -e documentation ]; then
            echo "documentation artifact not found"
            exit 1
          fi
          ls -al documentation

```

/action.yml——主workflow，配置环境，构建，上传至doc分支，发布到release

```yaml
name: 'Build sphinx docs'
description: 'Builds IDS Sphinx documentation'
permissions: 
  contents: write
inputs:
  docs_path: # id of input
    description: 'The path to the documentation folder from the repo root'
    required: false
    default: 'docs'
  conda_build_env_filepath:
    description: 'Yaml Conda build environment definition file'
    required: false
    default: 'action_default'
  conda_build_env_name:
    description: 'Name of the build conda environment'
    required: false
    default: 'action_default'
  base_env_prefix:  # id of input
    description: 'The prefix of the base Conda environment for self-hosted runs.'
    required: false
    default: '/usr/share/miniconda'
  artifact_name:
    description: 'Display name of the documentation artifact'
    required: false
    default: 'documentation'
  package_folder_path:
    description: 'Path to the folder containing the project''s package(s) to be installed'
    required: false
    default: 'conda_package'
  package_name:
    description: 'Name of the project''s Conda package'
    required: false
    default: ${{ github.event.repository.name }}
outputs:
  filepath:
    description: 'The file path of the generated HTML documentation'
    value: ${{ steps.main.outputs.filepath }}
runs:
  using: "composite"
  steps:
    - uses: actions/checkout@v2.2.0
      with:
        fetch-depth: 0 # Required due to the way Git works, without it this action won't be able to find any or the correct tags
    - uses: actions/download-artifact@v2
      with:
        path: artifacts
    - uses: tecoli-com/actions-use-apt-tools@v0
      with:
        tools: texlive-latex-recommended texlive-fonts-recommended tex-gyre texlive-latex-extra texlive-xetex texlive-luatex texlive-lang-chinese fonts-freefont-otf latexmk
    - id: main
      run: |
        echo "::set-output name=filepath::$(echo "None")"
        echo "CHECKS"
        echo "------"
        if [ -d ${{ inputs.docs_path }} ]; then
          echo "  Found the docs folder at ${{ inputs.docs_path }}"
        else
          echo "  ERROR: Unable to locate the docs path, ${{ inputs.docs_path }}. Skipping the build of the docs."
          exit 0
        fi
        echo ""
        echo "Selecting Build Env yml File"
        if [ ${{ inputs.conda_build_env_filepath }} = 'action_default' ]; then
          echo "Using the default conda configuration"
          CONDA_BUILD_ENV_FILE="${{ github.action_path }}/envs/build-docs.yml"
        elif [ -f ${{ inputs.conda_build_env_filepath }} ]; then
          CONDA_BUILD_ENV_FILE=${{ inputs.conda_build_env_filepath }}
        else
          echo "Using the default conda configuration"
          CONDA_BUILD_ENV_FILE="${{ github.action_path }}/envs/build-docs.yml"
        fi
        echo "CONDA_BUILD_ENV_FILE: ${CONDA_BUILD_ENV_FILE}"
        cat "${CONDA_BUILD_ENV_FILE}"

        echo 'source ${{ inputs.base_env_prefix }}/etc/profile.d/conda.sh'
        source ${{ inputs.base_env_prefix }}/etc/profile.d/conda.sh
        echo "Checking that Conda is initialized"
        if ! command -v conda &> /dev/null; then
          echo "ERROR: Conda is not setup."
          exit 1
        fi
        echo "  Conda is initialized"

        echo "Conda build docs env name"
        if [ ${{ inputs.conda_build_env_name }} = 'action_default' ]; then
          echo "Using the default conda build env name: ${{ github.event.repository.name }}-build-docs"
          CONDA_BUILD_ENV_NAME="${{ github.event.repository.name }}-build-docs"
        else
          echo "Using the provided conda build env name: ${{ inputs.conda_build_env_name  }}"
          CONDA_BUILD_ENV_NAME="${{ inputs.conda_build_env_name  }}"
        fi

        echo ""
        echo "SETUP BUILD ENV"
        echo "Set source"
        echo "-----------------"
        echo "Setting up ${{ github.event.repository.name }}-build environment"
        conda env update --name ${CONDA_BUILD_ENV_NAME} \
                         --file "${CONDA_BUILD_ENV_FILE}"  || \
            conda env create -f "${CONDA_BUILD_ENV_FILE}"
        conda activate ${CONDA_BUILD_ENV_NAME}
        ls -al ${{ inputs.package_folder_path }}
        echo "----------------"
        if [ -a ${{ inputs.package_folder_path }}/${{ inputs.package_name }}-*.bz2 ]; then
          conda update conda-build || conda install conda-build
          echo "Installing project package"
          CHANNEL_PATH="${{runner.temp}}/channel/linux-64"
          mkdir -p "${CHANNEL_PATH}"
          cp ${{ inputs.package_folder_path }}/${{ inputs.package_name }}-*.bz2 ${CHANNEL_PATH}
          conda index "${CHANNEL_PATH}"
          conda update -c "${CHANNEL_PATH}" ${{ inputs.package_name }} || \
            conda install -c "${CHANNEL_PATH}" ${{ inputs.package_name }} || \
            (conda uninstall ${{ inputs.package_name }} && \
              conda install -c "${CHANNEL_PATH}" ${{ inputs.package_name }})

        else
          echo "Did not install project package"
        fi
        echo ""
        echo "conda info"
        conda info
        echo ""
        echo "conda list"
        conda list

        echo ""
        echo "BUILD DOCS"
        echo "----------"
        cd ${{ inputs.docs_path }}
        if [ -e "./setup_source.sh" ]; then
          ./setup_source.sh
        fi
        make html
        make latexpdf
        make epub
        dir
        tar -cvf build.tar build
        gzip -9 build.tar
        zip -q -r build.zip build
        echo "::set-output name=filepath::$(echo '${{ inputs.docs_path }}/build/html')"
        cd build
        zip -q -r xuqinyang-doc.zip html
        cp xuqinyang-doc.zip ./html/xuqinyang-doc.zip
        cp ./latex/xuqinyang-doc.pdf ./html/xuqinyang-doc.pdf
        cp ./epub/xuqinyang-doc.epub ./html/xuqinyang-doc.epub
        cd ..
      shell: bash -l {0}
    - uses: actions/upload-artifact@v2
      with:
        name: ${{ inputs.artifact_name }}
        path: docs/build/
    - id: mkdir123
      run: |
        mkdir -p docs/build/
      shell: bash -l {0}
    - uses: JamesIves/github-pages-deploy-action@v4.3.3
      with:
        branch: doc
        folder: docs/build/html
    - id: previoustag
      uses: "WyriHaximus/github-action-get-previous-tag@v1"
      with:
        fallback: 1.0.0 # Optional fallback tag to use when no tag can be found
    - id: semvers
      uses: "WyriHaximus/github-action-next-semvers@v1"
      with:
        version: ${{ steps.previoustag.outputs.tag }}
    - uses: ncipollo/release-action@v1
      with:
        allowUpdates: true
        tag: ${{ steps.semvers.outputs.patch }}
        name: Release ${{ steps.semvers.outputs.v_patch }}
        artifacts: |
          docs/build.zip
          docs/build.tar.gz
branding:
  icon: 'book-open'
  color: 'blue'
```

/envs/build-docs.yml——需要的库

```yaml
name: build-docs
channels:
  - defaults
  - conda-forge
dependencies:
  - conda=4.9.2
  - pip
  - pip:
    - sphinx_markdown_tables==0.0.15
    - sphinx==4.5.0
    - recommonmark==0.7.1
    - sphinx_rtd_theme==1.0.0
    - sphinx-panels==0.6.0
    - sphinx-autobuild
    - sphinx-click==4.2.0
    - sphinx-copybutton
```

conf.py

```python
# Configuration file for the Sphinx documentation builder.
#
# This file only contains a selection of the most common options. For a full
# list see the documentation:
# https://www.sphinx-doc.org/en/master/usage/configuration.html

# -- Path setup --------------------------------------------------------------

# If extensions (or modules to document with autodoc) are in another directory,
# add these directories to sys.path here. If the directory is relative to the
# documentation root, use os.path.abspath to make it absolute, like shown here.
#
# import os
# import sys
# sys.path.insert(0, os.path.abspath('.'))


# -- Project information -----------------------------------------------------

project = 'xuqinyang-doc'
copyright = '2022, xuqinyang'
author = 'xuqinyang'

# The full version, including alpha/beta/rc tags
release = 'x.x.x'


# -- General configuration ---------------------------------------------------

# Add any Sphinx extension module names here, as strings. They can be
# extensions coming with Sphinx (named 'sphinx.ext.*') or your custom
# ones.
extensions = [
    'recommonmark',
    'sphinx_markdown_tables'
]

# Add any paths that contain templates here, relative to this directory.
templates_path = ['_templates']

# The language for content autogenerated by Sphinx. Refer to documentation
# for a list of supported languages.
#
# This is also used if you do content translation via gettext catalogs.
# Usually you set "language" from the command line for these cases.
language = 'zh_CN'

# List of patterns, relative to source directory, that match files and
# directories to ignore when looking for source files.
# This pattern also affects html_static_path and html_extra_path.
exclude_patterns = []


# -- Options for HTML output -------------------------------------------------

# The theme to use for HTML and HTML Help pages.  See the documentation for
# a list of builtin themes.
#
import sphinx_rtd_theme
html_theme = "sphinx_rtd_theme"
html_theme_path = [sphinx_rtd_theme.get_html_theme_path()]

# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".
html_static_path = ['_static']

#Add project information to the template context.
context = {
    'using_theme': "sphinx_rtd_theme",
    'html_theme': html_theme,
    'current_version': "latest",
    'version_slug': "latest",
    'MEDIA_URL': "https://media.readthedocs.org/",
    'STATIC_URL': "https://assets.readthedocs.org/static/",
    'PRODUCTION_DOMAIN': "readthedocs.org",
    'proxied_static_path': "/_/static/",
    'versions': [
    ("latest", "/zh_CN/latest/"),
    ],
    'downloads': [ 
    ("pdf", "//xqy2006.github.io/docs/xuqinyang-doc.pdf"),
    ("html", "//xqy2006.github.io/docs/xuqinyang-doc.zip"),
    ("epub", "//xqy2006.github.io/docs/xuqinyang-doc.epub"),
    ],
    'subprojects': [ 
    ],
    'slug': 'xuqinyang-doc',
    'name': u'xuqinyang-doc',
    'rtd_language': u'zh_CN',
    'programming_language': u'words',
    'canonical_url': 'https://xqy2006.github.io/docs/',
    'analytics_code': 'None',
    'single_version': False,
    'conf_py_path': '/docs/source/',
    'api_host': 'https://readthedocs.org',
    'github_user': 'xqy2006',
    'proxied_api_host': '/_',
    'github_repo': 'docs',
    'github_version': 'master',
    'display_github': True,
    'bitbucket_user': 'None',
    'bitbucket_repo': 'None',
    'bitbucket_version': 'main',
    'display_bitbucket': False,
    'gitlab_user': 'None',
    'gitlab_repo': 'None',
    'gitlab_version': 'main',
    'display_gitlab': False,
    'READTHEDOCS': True,
    'using_theme': (html_theme == "default"),
    'new_theme': (html_theme == "sphinx_rtd_theme"),
    'docsearch_disabled': False,
    'user_analytics_code': '',
    'global_analytics_code': 'UA-17997319-1',
    'commit': 'fb252565',
}

if 'html_context' in globals():
    
    html_context.update(context)
    
else:
    html_context = context
#readthedocs_build_url = 'https://github.com/xqy2006/docs'
```



#### 4. 成果

[https://xqy2006.github.io/docs](https://xqy2006.github.io/docs)
