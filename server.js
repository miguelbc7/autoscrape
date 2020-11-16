const http = require('http');
const app = require('./app');

var httpServer = http.createServer(app);
httpServer.listen(5005, () => {
    console.log('Express server listening on port ' + 5005);
});
