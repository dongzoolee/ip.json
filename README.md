# ip.json
접속자의 ip를 return 해주는 프로그램을 작성해봅시다!  
ip주소를 return 해주는 해외 api들의 속도가 너무 느려 직접 구현해 보았습니다.

**nginx**를 기준으로 작성하였습니다.

## 서브 도메인을 이용하지 않는다면
http://leed.at:7777 에서 바로 ip 주소를 return 하기를 원한다면,
다음과 같은 코드를 작성하면 됩니다.
```js
app.use('/', (req, res) => {
    res.json({ ip: req.connection.remoteAddress })
})
```
nosub_app.js를 이용하시면 됩니다.  
  
## 서브 도메인을 이용하고 싶다면,
먼저 제 ip.json 서비스의 구조는 다음과 같습니다.  
1. http://ip.leed.at 접속 -> return 301 https://ip.leed.at 
2. https://ip.leed.at 에서 -> proxy_pass http://leed.at:7777
3. http://leed.at:7777 (node.js) 에서 request.header['x-forwarded-for']를 return

만약 **서브 도메인을 이용하지 않는다면**에서의 코드를 그대로 이용한다면,  
누가 접속하던, 127.0.0.1 만 로그에 찍힙니다.  
**2번**의 proxy_pass를 해주는 과정에서, 사용자가 서버에 접속한 기록이 묻히고
새로 https://ip.leed.at 서버가 http://leed.at:7777 서버에 접속한 기록만 남기 때문에
localhost가 최종 접속자의 ip로 인식되는 것입니다.

두가지 방법으로 해결해 볼 수 있습니다.  
### 1. 2번 과정에서 proxy_pass를 하지 않고, return 301을 해준다.
https://ip.leed.at에서 http://leed.at:7777로 proxy_pass를 해주지 않는다면, 
원 접속자의 기록이 묻히지 않고 return 301만 두 번 진행되기 때문에, 우리가 원하는 결과를 얻을 수 있습니다.

```nginx
server {
	listen 80;
	server_name ip.leed.at;
	location / {
		return 301 https://ip.leed.at;
	}
}
server {
	listen 443 ssl;
	server_name ip.leed.at;
	ssl_certificate ssl_fullchain_location;
	ssl_certificate_key ssl_privkey_location;
	location / {
		add_header 'Access-Control-Allow-Origin' '*';
		return 301 http://leed.at:7777;
	}
}
```
  
  
### 2. proxy_pass 시에 x-forwarded-for 헤더 지정
그냥 nginx에서 기본적으로 제공하는 x-forwarded-for 헤더를 이용하면
원 접속자의 ip를 헤더에 저장한 상태로 proxy_pass를 진행할 수 있습니다.
[nginx docs.](https://www.nginx.com/resources/wiki/start/topics/examples/forwarded/#how-to-use-it-in-nginx)

```nginx
map $remote_addr $proxy_forwarded_elem {
    # IPv4 addresses can be sent as-is
    ~^[0-9.]+$          "$remote_addr";

    # IPv6 addresses need to be bracketed and quoted
    ~^[0-9A-Fa-f:.]+$   "\"[$remote_addr]\"";

    # Unix domain socket names cannot be represented in RFC 7239 syntax
    default             "unknown";
}
map $http_forwarded $proxy_add_forwarded {
    # If the incoming Forwarded header is syntactically valid, append to it
    "~^(,[ \\t]*)*([!#$%&'*+.^_`|~0-9A-Za-z-]+=([!#$%&'*+.^_`|~0-9A-Za-z-]+|\"([\\t \\x21\\x23-\\x5B\\x5D-\\x7E\\x80-\\xFF]|\\\\[\\t \\x21-\\x7E\\x80-\\xFF])*\"))?(;([!#$%&'*+.^_`|~0-9A-Za-z-]+=([!#$%&'*+.^_`|~0-9A-Za-z-]+|\"([\\t \\x21\\x23-\\x5B\\x5D-\\x7E\\x80-\\xFF]|\\\\[\\t \\x21-\\x7E\\x80-\\xFF])*\"))?)*([ \\t]*,([ \\t]*([!#$%&'*+.^_`|~0-9A-Za-z-]+=([!#$%&'*+.^_`|~0-9A-Za-z-]+|\"([\\t \\x21\\x23-\\x5B\\x5D-\\x7E\\x80-\\xFF]|\\\\[\\t \\x21-\\x7E\\x80-\\xFF])*\"))?(;([!#$%&'*+.^_`|~0-9A-Za-z-]+=([!#$%&'*+.^_`|~0-9A-Za-z-]+|\"([\\t \\x21\\x23-\\x5B\\x5D-\\x7E\\x80-\\xFF]|\\\\[\\t \\x21-\\x7E\\x80-\\xFF])*\"))?)*)?)*$" "$http_forwarded, $proxy_forwarded_elem";

    # Otherwise, replace it
    default "$proxy_forwarded_elem";
}

server {
	listen 80;
	server_name ip.leed.at;
	location / {
		return 301 https://ip.leed.at;
	}
}
server {
	listen 443 ssl;
	server_name ip.leed.at;
	ssl_certificate ssl_fullchain_location;
	ssl_certificate_key ssl_privkey_location;
	location / {
		proxy_set_header Forwarded $proxy_add_forwarded;
		add_header 'Access-Control-Allow-Origin' '*';
		proxy_pass http://leed.at:7777;
	}
}
```
app.js 소스코드를 이용하시면 됩니다.  