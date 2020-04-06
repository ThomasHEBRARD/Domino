var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

/* Choix du port local */
serv.listen(8000);

console.log("Le server a démarré")

/* Liste des joueurs version socket et player*/
var SOCKET_LIST = {};
var PLAYER_LIST = {};

var Player = function(id){
    var self = {
        id:id,
        number_of_dominos:7
    }
    return self;
}
/* Dès qu'il y a une connection, la function ci-dessous est appelée */
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){
    console.log('Un joueur s\'est connecté')

    /* On associe un id unique à chaque joueur */
    socket.id = Math.random();

    /* On ajoute à la liste des joeuurs l'objet socket qui
    représente un joueur avec des attributs (ici id) */
    SOCKET_LIST[socket.id] = socket;

    /* Et on créé le joueur pour le dissocier de socket */
    var player = Player(socket.id);
    PLAYER_LIST[socket.id] = player;

    /* On écoute à un émit coté client :*/
    /* Si un joueur se déconnecte, la fonction ci dessous sera appelée */
    /* On utilise son identifiant, socket.id pour le reconnaitre */
    /* Inutile de mettre un emit côté client, il est programmé automatiquement */
    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[socket.id];
    });
});

/* Cette fonction sera appellé toutes les 40ms */
/* Elle va nous permettre de voir qui a gagné*/
setInterval(function(){

}, 1000/25);