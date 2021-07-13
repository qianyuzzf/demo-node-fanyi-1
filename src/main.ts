import * as https from "https";
import * as queryString from "querystring";
import {appId, appPassword} from "./private_data";

const md5 = require('md5');

type ErrorMap = {
  [key: string]: string
}

const errorMap: ErrorMap = {
  52000: '成功',
  52001: '请求超时',
  52002: '系统错误',
  52003: '未授权用户',
  54000: '必填参数为空',
  54001: '签名错误',
  54003: '访问频率受限',
  54004: '账户余额不足',
  54005: '长query请求频繁',
  58000: '客户端IP非法',
  58001: '译文语言方向不支持',
  58002: '服务器当前已关闭',
  90107: '认证未通过或未认证',
};

export const translate = (word: string) => {
  let from;
  let to;
  if (/[a-zA-Z]/.test(word[0])) {
    from = 'en';
    to = 'zh';
  } else {
    from = 'zh';
    to = 'en';
  }

  const salt = Math.random();
  const sign = md5(appId + word + salt + appPassword);

  const query: string = queryString.stringify({
    q: word,
    appid: appId,
    from,
    to,
    salt,
    sign,
  });

  const options = {
    hostname: 'api.fanyi.baidu.com',
    port: 443,
    path: '/api/trans/vip/translate?' + query,
    method: 'GET'
  };

  const request = https.request(options, (response) => {
    let chunks: Buffer[] = [];
    response.on('data', (chunk) => {
      chunks.push(chunk);
    });
    response.on('end', () => {
      type BaiduResult = {
        from: string,
        to: string,
        trans_result: { src: string, dst: string }[],
        error_code?: string,
        error_msg?: string
      };
      const data: BaiduResult = JSON.parse(Buffer.concat(chunks).toString());
      if (data.error_code) {
        if (data.error_code in errorMap) {
          console.error(data.error_msg);
          console.error(errorMap[data.error_code]);
        } else {
          console.log(data.error_msg);
        }
        process.exit(1);
      } else {
        data.trans_result.map((item) => {
          console.log(item.dst);
        });
        process.exit(0);
      }
    });
  });

  request.on('error', (e) => {
    console.error(e);
  });
  request.end();
};