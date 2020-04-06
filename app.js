var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(8000);
console.log("Le server a démarré")

/* Dès qu'il y a une connection, la function ci-dessous est appelée*/
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    console.log('Un joueur s\'est connecté')
});