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
/* Variable globale qui contient tous les dominos possibles */
const allDominos = [];
/* Variable qui contient les chiffres Jouables */
var ChiffresJouables = [];

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
        PLAYER_LIST[name] = name;
        var player = new Player(socket.id);
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
        /* Plusieurs états pour savoir quel domino peut-être joué 
        -> Jouable : C'est à dire qu'il fait parti des Dominos qui peuvent être possiblement 
        posés au moment où c'est au joueur de jouer.
        -> Injouable : Le Domino est encore dans le Deck du joueur,
        Mais il ne peut pas être joué au vu des Dominos déjas posés.
        -> Posé : Le Domino est posé sur le terrain de jeu,
        il ne peut pas être modifié.
        --> Entourable : Lorsqu'un Domino est posé sur le terrain, il est "entourable",
        c'est à dire que le prochain joueur peut poser un de ses Dominos à côté.
        /* Par défaut, les Dominos sont tous injouables */
        this.state = "Injouable";
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

/*************** Les fonctions **************/

var LesDominosDuDeckJouables = function(data){
    var DECK = data.deck;
    for (var i = 0; i < DECK.length; i++){
        if (DECK[i].numbre_1 == data.possibility || DECK[i].numbre_2 == data.possibility){
            DECK[i].state = "Jouable";
        }
    }
}

var AnalyserLesOptions = function(deck){
    for (var i = 0; i < ChiffresJouables.length; i++){
        LesDominosDuDeckJouables({possibility: ChiffresJouables[i], deck: deck})
    }
    socket.emit('dessinerEnRouge', deck);
}

/* Création des dominos */
k = 0;
for (var i = 0; i <= 6; i++){
    for (var j = i; j <= 6; j++){
        allDominos[k] = new Domino(k, i, j)
        k += 1;
    }
}

var CopyList = function(List){
    allDominosToBeUsed = [];
    for (var i = 0; i < List.length; i++){
        allDominosToBeUsed.push(List[i]);
    }
    return(allDominosToBeUsed);
}
/* Méthode qui choisit des dominos au hasard au début pour
 créer le deck du joueur */
var chooseDominosForDeck = function(){
    var Dominos = [];
    var indexes_used = [];
    for (var i = 0; i < 7; i++){
        var index = Math.floor(Math.random()*allDominosToBeUsed.length);
        while (indexes_used.includes(index)){
            index = Math.floor(Math.random()*allDominosToBeUsed.length);
        }
        indexes_used.push(index);
        Dominos.push(allDominosToBeUsed[index]);
        delete allDominosToBeUsed[index];
        /* Créer une autre liste qui recharge à la fin du jeu, 
        pour pas relancer le serveur à chaque fois */
    }
    return Dominos;
}

/* Méthode qui return true (ou false)
 si le password entré par le joueur est le bon*/
var isValidPassword = function(data){
    return PLAYERS[data.username] === data.password;
}

/* return true ou false si le nom du player est déjà utilisé */
var isUsernameTaken = function(data){
    return PLAYERS[data.username];
}
 /* Méthode qui ajoute le profile d'un joueur à la dB */
var addPlayer = function(data){
    PLAYERS[data.username] = data.password;
}
/************************ Lancement du serveur ***************************/

/* Dès qu'il y a une connection, la function ci-dessous est appelée */
var io = require('socket.io')(serv, {});

io.sockets.on('connection', function(socket){
    var player_name = 'None';
    var allDominosToBeUsed = CopyList(allDominos);

    /* Réception côté serveur de la connexion du client */
    socket.on('signIn', function(data){
        if (isValidPassword(data)){
            /* Création du joueur qui s'est connecté */
            var player = new Player(data.username, socket);
            player_name = data.username;
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


    var deck = chooseDominosForDeck();
    socket.emit('drawDeck', deck);

    /* On écoute à un émit coté client :*/
    /* Si un joueur se déconnecte, la fonction ci dessous sera appelée */
    /* On utilise son identifiant, socket.id pour le reconnaitre */
    /* Inutile de mettre un emit côté client, il est programmé automatiquement */
    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
    });
    
    /* Messagerie instantanée */
    socket.on('sendMsgToServer', function(data){
        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('addToChat', player_name + ': ' + data);
        }
    });

    
});