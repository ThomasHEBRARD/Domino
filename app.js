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


/* Liste des sockets des joueurs */
var SOCKET_LIST = {};
var PLAYER_LIST = {};

/* username:password de tous les joueurs qui ont SignUp */
var PLAYERS = {
    "thomas": "coucou",
    "edouard": "heho",
}

/* Fonction qui return true (ou false)
 si le password entré par le joueur est le bon*/
var isValidPassword = function(data){
    return PLAYERS[data.username] === data.password
}

/* return true ou false si le nom du player est déjà utilisé */
var isUsernameTaken = function(data){
    return PLAYERS[data.username]
}

var addPlayer = function(data){
    PLAYERS[data.username] = data.password;
}
/********************** Les classes ******************/

/* Classe qui gère les joueurs */
class Player {
    constructor(socket, name) {
        this.name = name;
        this.number_dominos = 7;
        this.socket = socket;
    }
    /* Méthode qui est lancée quand un joueur se connecte */
    onConnect(socket) {
<<<<<<< HEAD
        PLAYER_LIST[name] = name;
        var player = new Player(socket.id);
=======
<<<<<<< HEAD
        PLAYER_LIST[name] = name;
=======
        var player = new Player(socket.id);
        console.log('salutsalut');
>>>>>>> df0a8e5edc8b7844e7ec1ba6baf8d4818032bf66
>>>>>>> e07e1b3ee5759a33515ea590af9b20051743937e
    };

    /* Méthode lancée quand un joueur se déconnecte */
    onDisconnect(socket) {
        /* On l'enlève de la liste des joueurs */
        delete SOCKET_LIST[socket.id];
        delete PLAYER_LIST[this.name];
    };

    /* Méthode qui met à jour les paramètres du joueur */
    update() {
        var pack = [];
        return pack;
    };
}

class Domino {
    constructor(id, numbre_1, numbre_2) {
        this.id = id;
        this.numbre_1 = numbre_1;
        this.numbre_2 = numbre_2;
        this.numbre_used = numbre_1;
        this.state = "North";
    }

    flip() {
        /* On initialise ce que l'on va envoyer en data pour le socket vers le client */
        var pack = [];
        /* On garde une trace de l'orientation du domino */
        if (this.state == "North") {
            this.state == "East";
        }
        else if (this.state == "East") {
            this.state = "South";
        }
        else if (this.state == "South") {
            this.state = "West";
        }
        else if (this.state == "West") {
            this.state = "North";
        }
        pack.push({
        num1: this.numbre_1,
            num2: this.numbre_2,
            state: this.state
        });

        /* On envoit au client pour changer le canvas */
        socket.emit('flip', pack);
    };

    /*correspondance(Domino) {
        if (this.numbre_used == nbr2) {
            return (true);
        }
        else {
            return (false);
        }
    };*/
}


/* Création des dominos */
const allDominos = {};
k = 0;
for (var i = 0; i <= 6; i++){
    for (var j = i; j <= 6; j++){
        allDominos[k] = new Domino(k, i, j)
        k += 1;
    }
}

/*************** Les fonctions **************/

/************************ Lancement du serveur ***************************/

/* Dès qu'il y a une connection, la function ci-dessous est appelée */
var io = require('socket.io')(serv, {});

io.sockets.on('connection', function(socket){

    /* Réception côté serveur de la connexion du client */
    socket.on('signIn', function(data){
        if (isValidPassword(data)){
            /* Création du joueur qui s'est connecté */
            var player = new Player(data.username, socket);
            socket.emit('signInResponse', {success:true});
        } else {
            socket.emit('signInResponse', {success:false});
        }
    });

    socket.on('signUp', function(data){
        if (isUsernameTaken(data)){
            socket.emit('signUpResponse', {success:false});
        } else {
            addPlayer(data);
            socket.emit('signUpResponse', {success:true});
        }
    });

    /* On associe un id unique à chaque joueur */
    socket.id = Math.random();
    
    /* On ajoute à la liste des joueurs l'objet socket qui
    représente un joueur avec des attributs (ici id) */
    SOCKET_LIST[socket.id] = socket;

    /* On écoute à un émit coté client :*/
    /* Si un joueur se déconnecte, la fonction ci dessous sera appelée */
    /* On utilise son identifiant, socket.id pour le reconnaitre */
    /* Inutile de mettre un emit côté client, il est programmé automatiquement */
    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
    });
    
    socket.on('sendMsgToServer', function(data){
        var playerName = ("" + socket.id).slice(2,7);
        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('addToChat', playerName + ': ' + data);
        } 
    });

    socket.emit('drawDeck');
});