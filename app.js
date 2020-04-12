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

    /* Méthode lancée quand un joueur se déconnecte */
    onDisconnect(socket) {
        /* On l'enlève de la liste des joueurs */
        delete SOCKET_LIST[socket];
        delete PLAYER_LIST[player];
    };
}

/* Classe qui gère les Dominos */
class Domino {
    constructor(id, numbre_1, numbre_2) {
        this.id = id;
        this.numbre_1 = numbre_1;
        this.numbre_2 = numbre_2;
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

    /* On cherche tous les doubles dans le premier deck */
    for (var i = 0; i < deck1.length; i++){
        if (deck1[i].numbre_1 == deck1[i].numbre_2){
            doubles_player1.push({chiffre_du_domino: deck1[i].numbre_1, index_du_domino: i});
            /* Cette liste contiendra tous les chiffres des dominos jumeaux */
            d1.push(doubles_player1[doubles_player1.length - 1].chiffre_du_domino);
        }
    }
    /* On cherche tous les doubles dans le 2eme deck */
    for (var i = 0; i < deck2.length; i++){
        if (deck2[i].numbre_1 == deck2[i].numbre_2){
            doubles_player2.push({chiffre_du_domino: deck2[i].numbre_1, index_du_domino: i});
            /* Cette liste contiendra tous les chiffres des dominos jumeaux */
            d2.push(doubles_player2[doubles_player2.length - 1].chiffre_du_domino);
        }
    }

    /* On cherche pour chaque deck le chiffre le plus haut */
    var max_1 = Math.max(...d1);
    var max_2 = Math.max(...d2);

    /* Enfin, il faut savoir a qui appartient ce double */
    /* Si ce double appartient au premier deck */
    if (Math.max((max_1, max_2)) == max_1){
        var index = 0;
        /* Enfin on cherche l'indice de ce domino dans le deck */
        for (var i = 0; i < deck1.length; i++){
            if (deck1[i].numbre_1 == max_1){
                index = i;
            }
        }
        return {numero_joueur: 0, index_du_domino: index, success: true};
        /* Si ce double appartient au premier deck */
    } else if (Math.max((max_1, max_2)) == max_2){
        /* Enfin on cherche l'indice de ce domino dans le deck */
        for (var i = 0; i < deck2.length; i++){
            if (deck2[i].numbre_1 == max_2){
                index = i;
            }
        }
        return {numero_joueur: 1, index_du_domino: index, success: true};
        /* Si il n'y a pas de doubles */
    } else {
        /* Si y'a aucun double, on choisi au pif */
        if (Math.random() >= 0.5){
            return {numero_joueur: 1, chiffre_du_domino: 0, success: false};
        } else {
            return {numero_joueur: 0, chiffre_du_domino: 0, success: false};
        }
    }
}


/* Choisir quel joueur commence : C'est le joueur avec le plus grand double qui doit commencer.
data est un dictionnaire des deck des 2 joueurs */
var QuiCommence = function(data){
    /* data = [deck1, deck2]*/
    Resultat = RecherchePlusGrandDouble(data);
    /* Numéro du joueur, 0 ou 1, pour le choisir dans la lsite PLAYER_LIST */
    var numero_du_joueur = Resultat.numero_joueur;

    if (!(Resultat.success)){
        ///////////// À TRAITER, PAS DE DOUBLE
        console.log("Pas de double");
    } else {
        /* Si il y a effectivement eu au moins un double */
        var index_du_domino = Resultat.index_du_domino;
    }
    /* On cherche le domino en question pour le jouer */
    var le_domino = PLAYER_LIST[numero_du_joueur].deck[index_du_domino];
    le_domino.state = "Entourable";

    /* Étape pour dire que c'est bien ce joueur qui a commencé à jouer */
    PLAYER_LIST[numero_du_joueur].compteur += 1;
    return {numero_joueur: numero_du_joueur, domino: le_domino};
}

/* Cette méthode renvoi, pour un numéro de domino jumeau, à qui appartient ce domino,
    et à quel joueur */
var NumeroDominoDuJoueur = function(index){
    for (var j = 0; j < PLAYER_LIST.length; j++){
        for (var i = 0; i < PLAYER_LIST[j].deck.length; i++){
            if (PLAYER_LIST[j].deck[i].id == index){
                return({numero_joueur: j, numero_du_domino: i})
            }
        }
    }
}

/* Cette méthode analyse quels sont les dominos du deck encore jouables, 
pour savoir quels dominos peuvent être joués au tour prochain */
var LesDominosDuDeckJouables = function(data){
    var DECK = data.deck;
    for (var i = 0; i < DECK.length; i++){
        if (DECK[i].numbre_1 == data.possibility || DECK[i].numbre_2 == data.possibility){
            DECK[i].state = "Jouable";
        }
    }
}

/* Méthode TEMPORAIRE */
var AnalyserLesOptions = function(deck){
    for (var i = 0; i < ChiffresJouables.length; i++){
        LesDominosDuDeckJouables({possibility: ChiffresJouables[i], deck: deck})
    }
}

/* On créé les 28 dominos du jeu */
k = 0;
for (var i = 0; i <= 6; i++){
    for (var j = i; j <= 6; j++){
        allDominos[k] = new Domino(k, i, j)
        k += 1;
    }
}

/* Méthode pour copier la liste globale des dominos, pour ne pas qu'elle soit modifiée */
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
        /* En faisant attention de supprimer les index et les dominos déjà utilisés */
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

/* Méthode qui vérifie que le joueur qui vient de se connecter n'était pas déjà connecté */
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
/* La function ci-dessous sera lancée dès que la page du site sera refresh */
io.sockets.on('connection', function(socket){
    var player_name = 'None';
    signIn = false;

    /* Si aucun joueur ne s'est connecté, c'est que c'est le début, donc on 
    copy la liste de tous les dominos */
    if (PLAYER_LIST.length == 0){
        allDominosToBeUsed = CopyList(allDominos);
    }

    /* Réception côté serveur de la connexion du client, on écoute */
    socket.on('signIn', function(data){
        /* data = {
            username: username,
            password: password
        }*/
        /* On limite dans une première étude le jeu ) 2 joueurs */
        if (!(PLAYER_LIST.length == 2)){
            /* On vérifie que le password rentré est bon, grace à la base de donnée d'utilisateurs qui ont signUp */
            if (isValidPassword(data)){
                /* On vérifie qu'il n'est pas connecté */
                if (NotAlreadyConnected(data)){
                    /* Dans ce cas, on peut créer son profil */
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
                    /* Joueur déjà connecté */
                    socket.emit('signInResponse', {success: 1});
                }
            } else {
                /* Mot de passe incorrect */
                socket.emit('signInResponse', {success: 2});
            }
        } else {
            /* Il y a trop de joueurs connectés */
            socket.emit('TropDeJoueurs');
        }
    });

    /* Ici, on écoute le client lorsqu'il se créé un compte */
    socket.on('signUp', function(data){
        /* Si on username est unique, on le rajoutera à la bdd */
        if (isUsernameTaken(data)){
            socket.emit('signUpResponse', {success:false});
        } else {
            addPlayer(data);
            socket.emit('signUpResponse', {success:true});
        }
    });

    /* Ici on écoute le lancé du jeu, lancé par un bouton côté client */
    socket.on('Commencer', function(){
        if (PLAYER_LIST.length == 2){
            /* data = {
                numero_joueur:...
                domino:...
            }*/
            /* On cherche qui doit commencer */
            var data = QuiCommence({deck1: PLAYER_LIST[0].deck, deck2 :PLAYER_LIST[1].deck});
            /* On communique au client pour qu'il puisse mettre à jour et dessiner */
            socket.broadcast.emit('PlacerPremierDomino', data);
        }
    });

    /* Cette méthode est utile pour effacer le domino utiliser. On repasse par le serveur pour
    connaître la socket qui doit être modifiée */
    
    socket.on('Effacer_le_domino_utilise', function(data){
        var num_domino = NumeroDominoDuJoueur(data.numero_du_domino);
        /* num_domino = {
            numero_joueur: ..,
            numero_du_domino: ..
        }*/
        var DATA = {
            player: PLAYER_LIST[data.numero_joueur],
            numero_domino: num_domino.numero_du_domino,
            index_joueur: data.numero_joueur
        };
        SOCKET_LIST[num_domino.numero_joueur].emit('Barrage_domino_debut', DATA)
    });

    

    /* On écoute à un émit coté client :*/
    /* Si un joueur se déconnecte, la fonction ci dessous sera appelée */
    /* On utilise son identifiant, socket.id pour le reconnaitre */
    /* Inutile de mettre un emit côté client, il est programmé automatiquement */
    socket.on('disconnect', function(){
        delete SOCKET_LIST[socket.id];
    });
    
    /* Messagerie instantanée */
    /* On rajoute pour les jours socket le nouveau texte qui vient d'être rentré
    par une seule socket. On aurait pu utiliser socket.broadcast.emit() */
    socket.on('sendMsgToServer', function(data){
        var index = SOCKET_LIST.indexOf(socket);
        for (var i in SOCKET_LIST) {
            SOCKET_LIST[i].emit('addToChat', PLAYER_LIST[index].name + ': ' + data);
        }
    });

    /* On écoute le client qui demande quels sont les dominos qui peuvent être joués 
    Voir rapport pour plus de détails */
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