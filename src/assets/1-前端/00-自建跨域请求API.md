# 跨域请求API 

① 请求方式：GET/POST（HTTP/HTTPS）

② 请求地址：https://xqy2006-cors.azurewebsites.net/api/cors

③ 请求参数：

| 参数名  | 位置       | 类型   | 必填 | 说明                                                  |
| :------ | :--------- | :----- | :--: | :---------------------------------------------------- |
| url     | body/query | string |  是  | 说明：要跨域请求的API的地址                           |
| method  | body/query | string |  否  | 说明：要跨域请求的API的方法                           |
| headers | body/query | string |  否  | 说明：要跨域请求的API的Headers，为json的string形式    |
| params  | body/query | string |  否  | 说明：要跨域请求的API的params参数，为json的string形式 |
| data    | body/query | string |  否  | 说明：要跨域请求的API的data参数，为json的string形式   |
| timeout | body/query | string |  否  | 说明：超时时间（单位：毫秒）                          |

④请求参数范例：

```
{
    "url": "https://www.baidu.com",
    "method": "get",
    "headers": "{"Content-Type": "application/json"}",
    "params": "{"param1": "abc", "param2": "abc"}",
    "data": "{"data1": "abc", "data2": "abc"}",
    "timeout": 1000,
}

```
