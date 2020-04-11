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

/***************** Déclaration de constantes *********************/

/* Liste des sockets des joueurs CONNECTÉS */
var SOCKET_LIST = [];
var PLAYER_LIST = [];

/* Garde une trace des dominos joués */
var DOMINOS_JOUES = [];

/* Base de donnée username:password de tous les joueurs qui ont SignUp */
var PLAYERS = {
    "thomas": "coucou",
    "edouard": "heho",
}

/* Variable globale qui contient tous les dominos possibles */
const allDominos = [];
var allDominosToBeUsed = [];
var indexes_used = [];

/* Variable qui contient les chiffres Jouables */
var ChiffresJouables = [];

/********************** Les classes ******************/

/* Classe qui gère les joueurs */
class Player {
    constructor(socket, name) {
        this.name = name;
        this.deck = [];
        this.socket = socket;
        this.compteur = 0;
    };

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
}

/*************** Les fonctions **************/

/* Pour commencer à jouer, on doit savoir qui a le plus grand double*/
/* Cette fonction renverra le numéro du joueur qui doit jouer, ainsi que le domino joué*/
var RecherchePlusGrandDouble = function(data){
    /* data ici sera un dictionnaire de deck1 et deck2 */
    var doubles_player1 = [];
    var doubles_player2 = [];
    var deck1 = data.deck1;
    var deck2 = data.deck2;
    var d1 = [];
    var d2 = [];

    for (var i = 0; i < deck1.length; i++){
        if (deck1[i].numbre_1 == deck1[i].numbre_2){
            doubles_player1.push({chiffre_du_domino: deck1[i].numbre_1, index_du_domino: i});
            d1.push(doubles_player1[doubles_player1.length - 1].chiffre_du_domino);
        }
    }
    for (var i = 0; i < deck2.length; i++){
        if (deck2[i].numbre_1 == deck2[i].numbre_2){
            doubles_player2.push({chiffre_du_domino: deck2[i].numbre_1, index_du_domino: i});
            d2.push(doubles_player2[doubles_player2.length - 1].chiffre_du_domino);
        }
    }
    var max_1 = Math.max(d1);
    var max_2 = Math.max(d2);

    if (Math.max([max_1, max_2]) == max_1){
        var index = 0;
        for (var i = 0; i < d1.length; i++){
            if (doubles_player1[i] == max_1){
                index = i;
            }
        }
        return {numero_joueur: 1, index_du_domino: index, success: true};
    } else if (Math.max([max_1, max_2]) == max_2){
        for (var i = 0; i < d2.length; i++){
            if (doubles_player2[i] == max_2){
                index = i;
            }
        }
        return {numero_joueur: 2, index_du_domino: index, success: true};
    } else {
        /* Si y'a aucun double, on choisi au pif */
        if (Math.random() >= 0.5){
            return {numero_joueur: 2, chiffre_du_domino: 0, success: false};
        } else {
            return {numero_joueur: 1, chiffre_du_domino: 0, success: false};
        }
    }
}


/* Choisir quel joueur commence : data est un dictionnaire des decsk des 2 joueurs */
var QuiCommence = function(data){
    /* data = [deck1, deck2]*/
    Resultat = RecherchePlusGrandDouble(data);
    var numero_du_joueur = Resultat.numero_joueur;

    if (!(Resultat.success)){
        ///////////// À TRAITER, PAS DE DOUBLE
    } else {
        /* Si il y a effectivement eu au moins un double */
        var index_du_domino = Resultat.index_du_domino;
    }
    /* On cherche le domino en question pour le jouer */
    var le_domino = PLAYER_LIST[numero_du_joueur].deck[index_du_domino];
    le_domino.state = "Entourable";

    /* Étape pour dire que c'est bien ce joueur qui a commencé à jouer */

    console.log({numero_joueur: numero_du_joueur, domino: le_domino});
    return {numero_joueur: numero_du_joueur, domino: le_domino};
}

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
    var allDominos = [];
    for (var i = 0; i < List.length; i++){
        allDominos.push(List[i]);
    }
    return(allDominos);
}

/* Méthode qui choisit des dominos au hasard au début pour
 créer le deck du joueur */
var chooseDominosForDeck = function(){
    var Dominos = [];
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
    return PLAYERS[data.username] == data.password;
}

/* return true ou false si le nom du player est déjà utilisé */
var isUsernameTaken = function(data){
    return PLAYERS[data.username];
}

 /* Méthode qui ajoute le profile d'un joueur à la dB */
var addPlayer = function(data){
    PLAYERS[data.username] = data.password;
}

var NotAlreadyConnected = function(data){
    var boolean = true;
    for (var i = 0; i < PLAYER_LIST.length; i++){
        if (PLAYER_LIST[i].name == data.username){
            boolean = false;
        }
    }
    return boolean;
}

/**************************************************************************/
/************************ Lancement de la page ***************************/
/**************************************************************************/

/* Dès qu'il y a une connection, la function ci-dessous est appelée */
var io = require('socket.io')(serv, {});

io.sockets.on('connection', function(socket){
    var player_name = 'None';
    signIn = false;

    if (PLAYER_LIST.length == 0){
        allDominosToBeUsed = CopyList(allDominos);
    }
    /* Réception côté serveur de la connexion du client */
    socket.on('signIn', function(data){
        /* data = {
            username: username,
            password: password
        }*/
        if (!(PLAYER_LIST.length == 2)){
            if (isValidPassword(data)){
                if (NotAlreadyConnected(data)){
                    var player = new Player(socket, data.username);
                    PLAYER_LIST.push(player);
                    /* Création du deck du joueur */
                    var deck = chooseDominosForDeck();
                    player.deck = deck;
                    /* On associe un id unique à chaque joueur */
                    socket.id = Math.random(); 
                    /* On ajoute à la liste des joueurs l'objet socket qui
                    représente un joueur avec des attributs (ici id) */
                    SOCKET_LIST.push(socket);
                    /* On comunique au Client les Infos: */
                    /* Ok le joueur peut se connecter, on peut changer de page */
                    socket.emit('signInResponse', {success: 0});
                    /* On peut dessiner son deck */
                    socket.emit('drawDeck', deck);
                    /* On peut afficher son nom */ 
                    socket.emit('Afficher_Joueur', {player_name: player.name});

                    /* PS : Ces trois emit peuvent être rassemblés en 1 seul */
                } else {
                    console.log('déja connecté');
                    socket.emit('signInResponse', {success: 1});
                }
            } else {
                socket.emit('signInResponse', {success: 2});
            }
        } else {
            socket.emit('TropDeJoueurs');
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

    /* On créé des Decks seulement sur moins de 2 joueurs sont connectés */
    if (PLAYER_LIST.length == 2){
        /* data = {
            numero_joueur:...
            le_domino:...
        }*/
        socket.emit('PlacerPremierDomino', QuiCommence([PLAYER_LIST[0].deck, PLAYER_LIST[1].deck]));
    }

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

    socket.on('QuelDomino', function(data){
        /* data est le numero du domino du deck du joueur */
        /* Savoir quel joueur a cliqué */
        var numero_joueur = SOCKET_LIST.indexOf(socket);
        var le_domino = PLAYER_LIST[numero_joueur].deck[data.numero];
        le_domino.state = "Entourable";

        /* Remettre les Dominos Jouables en Injouable */
        if (DOMINOS_JOUES.length != 0){
            DOMINOS_JOUES[DOMINOS_JOUES.length - 1].state = "Pose";
        }
        DOMINOS_JOUES.push(le_domino);
        /* Il faut maintenant le dessiner */
        socket.emit('LeDominoChoisi', {x: data.x});
        socket.emit('AQuiDeJouer', {jouer: false});
        /* Lancer l'analyse pour le prochain joueur. Et changer le joueur aussi */
        AnalyserLesOptions()
    });
});