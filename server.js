// var urlencode = require('urlencode');
// var json = require('json-middleware');

var express = require("express"),
    app = express(),
    bodyParser = require('body-parser'),
    errorHandler = require('errorhandler'),
    methodOverride = require('method-override'),
    hostname = process.env.HOSTNAME || 'localhost',
    port = 8080;

app.get("/", function(req, res) {
    res.redirect("/index.html");
});

var db = require('mongoskin').db('mongodb://user:password@localhost:27017/photos');
console.log(db);

var todos = [];

app.get("/addtodo", function(req, res) {
    var x = req.query;
    var callback = function(error, result) {
        if (result) {
            res.end("added");
        }
    };
    db.collection("todo").insert(x, callback);
});

app.get("/edittodo", function(req, res) {
    var x = req.query;
    var callback = function(error, result) {
        if (result) {
            res.end("done");
        }
    };

    db.collection("todo").findOne({
        todoid: x.todoid
    }, function(err, result1) {
        if (result1) {
            console.log(result1);
            result1.newtodo = x.newtodo;
            db.collection("todo").save(result1, callback);
        } else {
            db.collection("todo").insert(x, callback);
        }
    });

});




app.get("/deletetodo", function(req, res) {
    var index = req.query.index;
    var callback = function(error, result) {
        if (result) {
            res.end("deleted");
        }
    };
    db.collection("todo").remove({
        "todoid": index.toString()
    }, callback);
});


app.get("/listtodos", function(req, res) {
    db.collection("todo").find().toArray(function(err, result) {
        if (result) {
            res.end(JSON.stringify(result));
        }
    });
});

app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static(__dirname + '/client'));
app.use(errorHandler({
    dumpExceptions: true,
    showStack: true
}));


var fs = require('fs');
var AWS = require('aws-sdk');
AWS.config.loadFromPath('./credentials.json');
var s3 = new AWS.S3(); //.client;
console.log(s3);

var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
app.use('/uploadFile', multipartMiddleware);

app.post('/uploadFile', function(req, res) {
    console.log(req.body);
    var intname = req.body.fileInput;
    var filename = req.files.input.name;
    var fileType = req.files.input.type;
    var tmpPath = req.files.input.path;
    var s3Path = '/' + intname;

    fs.readFile(tmpPath, function(err, data) {
        var params = {
            Bucket: 'ameweb',
            ACL: 'public-read',
            Key: intname,
            Body: data
        };
        s3.putObject(params, function(err, data) {
            console.log(err);
            res.end("success");
        });
    });
});


console.log("Simple static server listening at http://" + hostname + ":" + port);
app.listen(port, hostname);
