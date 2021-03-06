var express = require('express');
var bodyParser = require('body-parser');
var pg = require('pg');

var app = express();

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 5000;
var databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/zenika-rpg';

app.use(bodyParser.json());
app.use(express.static('.'));

function containArg(arg) {
    return process.env.npm_config_argv.indexOf(arg) != -1
}

function executeQueryWithCallback(query, params, response, callback) {
    pg.connect(databaseUrl, function (err, client, done) {
        try {
            if (!client) {
                return;
            }
            client.query(query, params, function (err, result) {
                done();
                if (err) {
                    console.error(err);
                    response.send("Error " + err);
                }
                else {
                    callback(result);
                }
            });
        } catch (error) {
            try {
                done();
            } catch (error) {
                // nothing to do just keep the program running
            }
        }
    });
}

function executeQuery(query, params, response) {
    executeQueryWithCallback(query, params, response, function (result) {
        response.send({"results": result.rows});
    });
}

app.get('/config', function (request, response) {
    response.send({
        debug: containArg('--debug'),
        noDataBase: containArg('--no-database')
    });
});

app.use('/', express.static('.'));

app.post('/api/game', function (request, response) {
    var data = request.body;

    executeQueryWithCallback(
        'INSERT into player (firstname, lastname, email, score, submit_date, duration) VALUES($1, $2, $3, $4, CURRENT_TIMESTAMP, $5) RETURNING id',
        [
            data.player.firstname,
            data.player.lastname,
            data.player.email,
            data.score,
            data.time
        ],
        response,
        function (result) {
            var playerId = result.rows[0].id;
            data.questions.forEach(function (question) {
                executeQueryWithCallback(
                    'INSERT into reponse (f_player_id, type, index, question, reponse, bonne_reponse, temps_reponse) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING id',
                    [
                        playerId,
                        question.type,
                        question.index,
                        question.libelle,
                        question.reponse,
                        question.bonneReponse,
                        question.tempsReponse
                    ],
                    response,
                    function (result) {
                    }
                );
            });
        }
    );

    response.status(201).send(request.body);
});

app.get('/api/questions/:type', function (request, response) {
    executeQuery(
        'SELECT * FROM question where type=($1)',
        [request.params.type],
        response);
});

app.get('/api/players/:email', function (request, response) {
    executeQuery(
        'SELECT * FROM player where email=($1)',
        [request.params.email],
        response);
});

app.get('/db/reponses', function (request, response) {
    executeQuery(
        'SELECT * FROM reponse',
        [],
        response);
});

app.get('/db/players', function (request, response) {
    executeQuery(
        'SELECT * FROM player',
        [],
        response);
});

app.get('/db/questions', function (request, response) {
    executeQuery(
        'SELECT * FROM question',
        [],
        response);
});

app.get('/db/winners', function (request, response) {
    executeQuery(
        `
                        select p.firstname, p.lastname, p.email, score.score from
                        player as p,
                        (
                            select r.f_player_id as p_id, sum((
                            case 	when r.reponse=r.bonne_reponse then 1
                                else 0
                            end
                            )*50*(exp(100./r.temps_reponse))) as score, sum(r.temps_reponse) as temps from reponse as r
                            group by r.f_player_id
                        ) as score
                        where score.p_id=p.id
                        order by score.score desc
                        limit 5;
                        `,
        [],
        response);
});

app.listen(port, function () {
    console.log('App listening on port ' + port + '!');
    console.log('App databaseUrl ' + databaseUrl + '!');
});
