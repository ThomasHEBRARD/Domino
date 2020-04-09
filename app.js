/* MADE BY THOMAS HEBRARD
    AND    EDOUARD LAJOUANIE */

/***************** Création serveur *********************/

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

/********************** Les classes ******************/

/* Liste des sockets des joueurs */
var SOCKET_LIST = {};

/* Classe qui gère les joueurs */
var Player = function(id){
    var self = {
        id:id,
        number_of_dominos:7
    }
    return self;
}
/* Liste qui contiendra les joueurs */
Player.list = {};

/* Fonction qui est lancée quand un joueur se connecte */
Player.onConnect = function(socket){
    var player = Player(socket.id);

    /* On ajoute un listener pour le clic */
    socket.on('clic', function(date){

    });
}

/* Fonction lancée quand un joueur se déconnecte */
Player.onDisconnect = function(socket){
    /* On l'enlève de la liste des joueurs */
    delete Player.list[socket.id];
}

/* Fonction qui met à jour les paramètres du joueur */
Player.update = function(){
    var pack = [];
    for(var p in Player.list){
        var player = Player.list[i];
        player.update();
        pack.push({

        });
    }
    return pack;
}


var Domino = function(id, numbre_1, numbre_2){
    var self = {
        id:id,
        numbre_1:numbre_1,
        numbre_2:numbre_2,
        numbre_used:None,
        state:"North"
    };

    self.flip = function(){
        /* On initialise ce que l'on va envoyer en data pour le socket vers le client */
        var pack = [];

        /* On garde une trace de l'orientation du domino */
        if (self.state == "North"){
            self.state == "East";
        } else if (self.state == "East"){
            self.state = "South";
        } else if (self.state == "South"){
            self.state = "West";
        } else if (self.state == "West"){
            self.state = "North";
        }


        pack.push({num1:self.numbre_1,
            num2:self.numbre_2,
            state:self.state
        });
        /* On envoit au client pour changer le canvas */
        socket.emit('flip', pack);
    }

    self.correspondance = function(Domino){
        if (self.nu == nbr2){
            return(true);
        } else {
            return(false);
        }
    }
}

/* Création des dominos */
const allDominos = {};
k = 0
for (var i = 0; i <= 6; i++){
    for (var j = i; j <= 6; i++){
        allDominos[k] = Domino(k, i, j)
        k ++;
    }
}
/*************** Les fonctions **************/

function getRandomDominos(players, allDominos){

}
/************************ Lancement du serveur ***************************/

/* Dès qu'il y a une connection, la function ci-dessous est appelée */
var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket){

    /* On associe un id unique à chaque joueur */
    socket.id = Math.random();

    /* On ajoute à la liste des joueurs l'objet socket qui
    représente un joueur avec des attributs (ici id) */
    SOCKET_LIST[socket.id] = socket;

    Player.onConnect(socket);

    /* On écoute à un émit coté client :*/
    /* Si un joueur se déconnecte, la fonction ci dessous sera appelée */
    /* On utilise son identifiant, socket.id pour le reconnaitre */
    /* Inutile de mettre un emit côté client, il est programmé automatiquement */
    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
        Player.onDisconnect(socket);
    });

    socket.on('clic', function(position){
    })

    socket.emit('drawDeck');
});

/* Cette fonction sera appellé toutes les 40ms */
/* Elle va nous permettre de voir qui a gagné*/
setInterval(function(){
    
}, 1000/25);