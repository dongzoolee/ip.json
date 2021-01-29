const express = require('express');
const app = express();
app.set('port', 7777)
app.use('/', (req, res) => {
    console.log(req.headers)
    var ip = req.headers['forwarded'];
    if (ip.substr(0, 7) === "::ffff:") {
        ip = ip.substr(7)
    }
    res.json({ ip: ip })
})
const server = app.listen(app.get('port'), (req, res) => {
    console.log('server has started on ' + app.get('port'))
})