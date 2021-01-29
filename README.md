# ip.json
접속자의 ip를 return 해주는 프로그램을 작성해봅시다!

## 0. 시작하기 전에
제 ip.json 서비스의 구조는 다음과 같습니다.  
1. http://ip.leed.at 접속 -> return 301 https://ip.leed.at 
2. https://ip.leed.at 에서 -> proxy_pass http://leed.at:7777
3. http://leed.at:7777 (node.js) 에서 request.header['x-forwarded-for']를 return

- 굳이 이렇게 해야할까요?`  
아닙니다.  
http://leed.at:7777에서 바로 ip 주소를 return 하기를 원한다면,
다음과 같은 코드를 작성하면 됩니다.
```js
app.use('/', (req, res) => {
    res.json({ ip: req.connection.remoteAddress })
})
```