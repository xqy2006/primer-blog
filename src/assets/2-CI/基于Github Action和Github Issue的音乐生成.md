# 基于Github Action和Github Issue的音乐生成

#### 1. 一些说明

​		之前写过一个前端(Vue)+后端(Flask)版的，无奈服务器终有一天会到期，由于有着做第一个项目的经验，所以想到了使用Github Action作为后端，但是如果自己写前端的话势必需要对Github进行一些操作才能触发workflow，而对Github进行一些操作又需要登录Github账号，太麻烦了，有可能还会导致token泄露，不如直接使用Github自带的Issue作为自己的前端（~~其实是懒得写~~）

#### 2. 一些坑

​		①numpy绝对是大坑，各种版本不兼容（因此没有将packages上传至仓库）

​		②issue是markdown的输入markdown的输出，因此需要对body进行一些处理（yaml几乎没有对字符串处理的能力，只能交给脚本了）

​		③一定要等待Github Pages部署完毕后再评论，要不然结果还未部署用户就有可能发起下载请求

#### 3. 主要代码

训练过程省略，直接推理

由于Github最大文件限制为100M，故将模型压缩

music.py——推理主程序

```python
import zipfile
 
f = zipfile.ZipFile("./Midi_Model/best_model.zip",'r') # 压缩文件位置
for file in f.namelist():
    f.extract(file,"./Midi_Model/")               # 解压位置
f.close()
f = zipfile.ZipFile("./Midi_Model/final_model.zip",'r') # 压缩文件位置
for file in f.namelist():
    f.extract(file,"./Midi_Model/")               # 解压位置
f.close()
import sys
input = sys.argv[3]
import os
import json
from music21 import *
import base64
import paddle
import paddle.nn as nn
import numpy as np
from Reader import Reader
import Seq2Seq
from binascii import b2a_hex

batch_size = 10
train_reader = Reader(batch_size, './work/data')
import json
import time
# 初始化log写入器

# 模型参数设置
embedding_size = 256
hidden_size = 256
num_layers = 1

# 训练参数设置
epoch_num = 5000
learning_rate = 1e-5
log_iter = 200

# 定义一些所需变量
global_step = 0
log_step = 0
max_acc = 0

midi_model = Seq2Seq.Midi_Model(
    char_len=0x9FFF,  # 基本汉字的Unicode码范围为4E00-9FA5,这里设置0x9FFF长，基本够用
    embedding_size=embedding_size,
    hidden_size=hidden_size,
    num_layers=num_layers,
    batch_size=batch_size)
dur_model = Seq2Seq.Duration_Model(
    char_len=200,  # midi范围一般在100左右,这里设置200长，基本够用
    embedding_size=embedding_size,
    hidden_size=hidden_size,
    num_layers=num_layers,
    batch_size=batch_size)
midi_model.set_state_dict(paddle.load('Midi_Model/final_model'))
dur_model.set_state_dict(paddle.load('Duration_Model/final_model'))
input_lyrics = input
lyrics = []
for i, lyric in enumerate(input_lyrics.replace('\n', '')):
    if i % batch_size == 0:
        lyrics.append([])
    lyrics[i // batch_size].append(ord(lyric))
while len(lyrics[-1]) % batch_size != 0:
    lyrics[-1].append(ord('#'))
lyrics = paddle.to_tensor(lyrics)

params_dict = paddle.load('Midi_Model/best_model')
midi_model.set_dict(params_dict)

# 设置为评估模式
midi_model.eval()

# 模型推理
out = midi_model(lyrics)

# 结果转换
results = []
for _ in np.argmax(out.numpy(), -1).reshape(-1):
    results.append(_)

midis = []
dur_dic = {}
with open('dur_dic.json', 'r') as f:
    dur_str = f.readline()
    dur_dic = json.loads(dur_str)
for i, midi in enumerate(results):
    if i % batch_size == 0:
        midis.append([])
    midis[i // batch_size].append(midi) if midi <= 200 else midis[i // batch_size].append(0)
while len(midis[-1]) % batch_size != 0:
    midis[-1].append(0)
midis = paddle.to_tensor(midis)

params_dict = paddle.load('Duration_Model/best_model')
dur_model.set_dict(params_dict)

# 设置为评估模式
dur_model.eval()

# 模型推理
# out = nn.Softmax(dur_model(midis))
out = dur_model(midis)

# 结果转换
durations = []
for _ in np.argmax(out.numpy(), -1).reshape(-1):
    durations.append(_)

dur_dic = {}
with open('dur_dic.json', 'r') as f:
    dur_str = f.readline()
    dur_dic = json.loads(dur_str)
    print(dur_dic)

stream1 = stream.Stream()
for i, lyric in enumerate(input_lyrics.replace('\n', '')):
    if results[i] != 0:
        n1 = note.Note(results[i])
    else:
        n1 = note.Rest()
    n1.addLyric(lyric)
    n1.duration = duration.Duration(dur_dic[str(durations[i])])
    stream1.append(n1)
import random
name = ''
stream1.write("xml", './result/music/' + sys.argv[4] + ".xml")
stream1.write('midi', './result/music/' + sys.argv[4] + '.midi')
output = input + '.midi'
print(output)

```

verify.py——校验输入是否全部为中文字符，若不是则报错，由verify.yml进行后续操作

```python
import sys
input = sys.argv[3]
def check_contain_chinese(check_str):
	for ch in check_str:
		if u'\u4e00' <= ch <= u'\u9f5a':
			pass
		else:
			return True
	return False
if check_contain_chinese(input):
	raise Exception('error')

```

sleep.py——等待Github Pages部署完成后再回复

```python
import requests
import os
import urllib3
import time
urllib3.disable_warnings()
import sys
def download(url):
  headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:68.0) Gecko/20100101 Firefox/68.0"
  }
  r = requests.get(url=url, headers=headers,verify=False)
  return r.status_code
while download('http://xqy2006.github.io/music_generation/'+sys.argv[1]+'.xml')==404:
  print("Page undeploy")
  time.sleep(5)
print("finish")
```

/.github/ISSUE_TEMPLATE/music_generation.yml——问题模板

```yaml
name: 音乐生成
description: 音乐生成
title: "音乐生成"
labels: ["music_generation"]
body:
  - type: textarea
    id: input_text
    attributes:
      label: "歌词"
      description: 请输入要谱曲的歌词（只能是中文，无标点）：
      placeholder: 
      value: 
    validations:
      required: true

```

music_generation/.github/workflows/music.yml——主workflow，将issue的body与id传入python处理，push生成结果文件到store分支构建Github Pages，回复并关闭issue

```yaml
name: music
on:
  issues:
    types: [opened,edited]
  workflow_dispatch:
jobs:
  build:

    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2
    - uses: ahmadnassri/action-workflow-queue@v1
    - run: |
          mkdir -p ./id
          echo $ID > ./id/id
      env:
          ID: ${{ github.event.issue.number }}
    - uses: actions/upload-artifact@v3
      with:
          name: id
          path: id/
    - uses: actions/setup-python@v4
      with:
        python-version: '3.x' # Version range or exact version of a Python version to use, using SemVer's version range syntax
        architecture: 'x64' # optional x64 or x86. Defaults to x64 if not specified
    - uses: actions/cache@v3
      with:
        path: ~/.cache/pip
        key: ${{ runner.os }}-pip-${{ hashFiles('**/requirements.txt') }}
        restore-keys: |
          ${{ runner.os }}-pip-
    - run: |
        python verify.py $BODY
        git clone -b store https://github.com/xqy2006/music_generation.git "result"
        pip install -r requirements.txt
        python music.py $BODY $ID
      env:
          BODY: ${{ github.event.issue.body }}
          ID: ${{ github.event.issue.number }}
    - uses: FedericoCarboni/setup-ffmpeg@v1
      id: setup-ffmpeg
    - run: sudo apt-get install -y timidity
    - run: |
        timidity ./result/music/$ID.midi -Ow -o - | ffmpeg -i - -acodec libmp3lame -ab 64k ./result/music/$ID.mp3
      env:
          BODY: ${{ github.event.issue.body }}
          ID: ${{ github.event.issue.number }}
    - uses: JamesIves/github-pages-deploy-action@v4.3.3
      with:
        branch: store
        folder: result
    - uses: rishabhgupta/split-by@v1
      id: split
      with:
        string: ${{ github.event.issue.body }}
        split-by: "歌词 \n "
    - uses: mad9000/actions-find-and-replace-string@2
      id: findandreplace
      with:
        source: ${{ steps.split.outputs._1}} # this translates to ref/heads/main on the main branch, but can be any arbitrary string 
        find: "\n"        # we want to remove ref/heads/ from source 
        replace: ''               # and replace it with a blank string (ie. removing it)
    - run: |
        python sleep.py $ID
        echo OK!
      env:
        ID: ${{ github.event.issue.number }}
    - name: Create comment
      uses: actions-cool/issues-helper@v2
      with:
          actions: 'create-comment'
          token: ${{ secrets.GITHUB_TOKEN }}
          issue-number: ${{ github.event.issue.number }}
          body: |
            你好 ${{ github.event.issue.user.login }} ，生成结果如下：
            mp3格式下载地址为（无曲谱，可直接播放）：
            https://xqy2006.github.io/music_generation/music/${{ github.event.issue.number }}.mp3
            midi格式下载地址为（导入到曲谱软件中无歌词，可在电脑上直接播放）：
            https://xqy2006.github.io/music_generation/music/${{ github.event.issue.number }}.midi
            xml格式下载地址为（导入到曲谱软件中有歌词，不可在电脑上直接播放）：
            https://xqy2006.github.io/music_generation/music/${{ github.event.issue.number }}.xml
    - name: Close issue
      uses: actions-cool/issues-helper@v2
      with:
          actions: 'close-issue'
          token: ${{ secrets.GITHUB_TOKEN }}
          issue-number: ${{ github.event.issue.number }}
```

music_generation/.github/workflows/verify.yml——当music.yml报错后运行（由verify.py抛出），回复并关闭issue

```yaml
name: verify
on:
  workflow_run:
    workflows: [music]
    types: [completed]
jobs:
  on-failure:
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    steps:
      - name: 'Download artifact'
        uses: actions/github-script@v6
        with:
          script: |
            let allArtifacts = await github.rest.actions.listWorkflowRunArtifacts({
               owner: context.repo.owner,
               repo: context.repo.repo,
               run_id: context.payload.workflow_run.id,
            });
            let matchArtifact = allArtifacts.data.artifacts.filter((artifact) => {
              return artifact.name == "id"
            })[0];
            let download = await github.rest.actions.downloadArtifact({
               owner: context.repo.owner,
               repo: context.repo.repo,
               artifact_id: matchArtifact.id,
               archive_format: 'zip',
            });
            let fs = require('fs');
            fs.writeFileSync(`${process.env.GITHUB_WORKSPACE}/id.zip`, Buffer.from(download.data));

      - name: 'Unzip artifact'
        run: unzip id.zip

      - name: 'Comment on issue'
        uses: actions/github-script@v6
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          script: |
            let fs = require('fs');
            let issue_number = Number(fs.readFileSync('./id'));
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: issue_number,
              body:"# 您的输入有误！\n请检查您的输入是否全部为中文字符，并且没有标点\n可以通过 https://xqy2006.github.io/Chinese-character/ 去除非中文字符",
                      });
            await github.rest.issues.update({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: issue_number,
            state: 'closed',
            });
```

Seq2Seq.py——推理所需

```python
import paddle
import paddle.nn as nn

# 继承paddle.nn.Layer类
class Midi_Model(nn.Layer):
    # 重写初始化函数
    # 参数：字符表长度、嵌入层大小、隐藏层大小、解码器层数、处理数字的最大位数
    def __init__(self, char_len, embedding_size=128, hidden_size=128, num_layers=1, batch_size=20):
        super(Midi_Model, self).__init__()
        # 初始化变量
        self.MAXLEN = 1
        self.batch_size = batch_size
        self.hidden_size = hidden_size
        self.char_len = char_len
        self.num_layers=num_layers
        self.embedding_size=embedding_size

        # 嵌入层
        self.emb = nn.Embedding(
            char_len,
            self.embedding_size
        )

        # 编码器
        self.encoder = nn.LSTM(
            input_size=self.embedding_size,
            hidden_size=self.hidden_size,
            num_layers=self.num_layers
        )

        # 解码器
        self.decoder = nn.LSTM(
            input_size=self.hidden_size,
            hidden_size=self.hidden_size,
            num_layers=self.num_layers
        )

        # 全连接层
        self.fc = nn.Linear(
            self.hidden_size,
            char_len
        )

    # 重写模型前向计算函数
    # 参数：输入[None, MAXLEN]、标签[None, DIGITS]
    def forward(self, inputs, labels=None):
        # 嵌入层
        out = self.emb(inputs)

        # 编码器
        out, (_, _) = self.encoder(out)

        # 按时间步切分编码器输出
        out = paddle.split(out, self.MAXLEN, axis=1)

        # 取最后一个时间步的输出并复制batch_size次
        out = paddle.expand(out[-1], [out[-1].shape[0], self.batch_size, self.hidden_size])

        # 解码器
        out, (_, _) = self.decoder(out)

        # 全连接
        out = self.fc(out)

        # 如果标签存在，则计算其损失和准确率
        if labels is not None:
            # 转置解码器输出
            tmp = paddle.transpose(out, [0, 2, 1])

            # 计算交叉熵损失
            loss = nn.functional.cross_entropy(tmp, labels, axis=1)

            # 计算准确率
            acc = paddle.metric.accuracy(paddle.reshape(out, [-1, self.char_len]), paddle.reshape(labels, [-1, 1]))

            # 返回损失和准确率
            return loss, acc

        # 返回输出
        return out


# 继承paddle.nn.Layer类
class Duration_Model(nn.Layer):
    # 重写初始化函数
    # 参数：字符表长度、嵌入层大小、隐藏层大小、解码器层数、处理数字的最大位数
    def __init__(self, char_len, embedding_size=128, hidden_size=64, num_layers=1, batch_size=20):
        super(Duration_Model, self).__init__()
        # 初始化变量
        self.batch_size = batch_size
        self.MAXLEN = 1
        self.hidden_size = hidden_size
        self.char_len = char_len
        self.num_layers=num_layers
        self.embedding_size=embedding_size

        # 嵌入层
        self.emb = nn.Embedding(
            self.char_len,
            self.embedding_size
        )

        # 编码器
        self.encoder = nn.LSTM(
            input_size=embedding_size,
            hidden_size=self.hidden_size,
            num_layers=self.num_layers
        )

        # 解码器
        self.decoder = nn.LSTM(
            input_size=self.hidden_size,
            hidden_size=self.hidden_size,
            num_layers=self.num_layers
        )

        # 全连接层
        self.fc = nn.Linear(
            self.hidden_size,
            self.char_len
        )

    # 重写模型前向计算函数
    # 参数：输入[None, MAXLEN]、标签[None, DIGITS]
    def forward(self, inputs, labels=None):
        # 嵌入层
        out = self.emb(inputs)

        # 编码器
        out, (_, _) = self.encoder(out)

        # 按时间步切分编码器输出
        out = paddle.split(out, self.MAXLEN, axis=1)

        # 取最后一个时间步的输出并复制batch_size次
        out = paddle.expand(out[-1], [out[-1].shape[0], self.batch_size, self.hidden_size])

        # 解码器
        out, (_, _) = self.decoder(out)

        # 全连接
        out = self.fc(out)

        # 如果标签存在，则计算其损失和准确率
        if labels is not None:
            # 转置解码器输出
            tmp = paddle.transpose(out, [0, 2, 1])

            # 计算交叉熵损失
            loss = nn.functional.cross_entropy(tmp, labels, axis=1)

            # 计算准确率
            acc = paddle.metric.accuracy(paddle.reshape(out, [-1, self.char_len]), paddle.reshape(labels, [-1, 1]))

            # 返回损失和准确率
            return loss, acc

        # 返回输出
        return out
```

Reader.py——推理所需

```python
from music21 import note,converter
import numpy as np
import os
import json
import fractions

def Reader(DIGITS,path = './work/data'):
    dur_dic = {}
    def read_data():
        for file in os.listdir(path):
            lyrics = []
            midis = []
            durations = []
            xml = converter.parseFile(os.path.join(path,file))
            #print(dir(stream.Score()))
            for i, note in enumerate(xml.recurse().notesAndRests):
                if i%DIGITS == 0:
                    lyrics.append([])
                    midis.append([])
                    durations.append([])
                lyric = note._getLyric()
                if lyric == None:
                    lyric = '#'
                lyrics[i//DIGITS].append(ord(lyric))
                try:
                    midis[i//DIGITS].append(note.pitch.midi)
                except:
                    midis[i//DIGITS].append(0)
                durations[i//DIGITS].append(note.duration.quarterLength)
                if type(note.duration.quarterLength) == fractions.Fraction and float(note.duration.quarterLength) not in list(dur_dic.values()):
                        dur_dic[len(dur_dic)] = float(note.duration.quarterLength)
                elif type(note.duration.quarterLength) != fractions.Fraction and note.duration.quarterLength not in list(dur_dic.values()):
                    dur_dic[len(dur_dic)] = note.duration.quarterLength
            yield [midis,durations,lyrics]
        with open('dur_dic.json','w') as f:
            f.write(json.dumps(dur_dic))
    return read_data
```

#### 4. 成果

[https://www.github.com/xqy2006/music_generation](https://www.github.com/xqy2006/music_generation)