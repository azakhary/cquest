var fs = require('fs')
var express = require('express')
var app = express()

app.use(express.static('public'));

var router = express.Router();

var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({
   extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

var MongoClient = require('mongodb').MongoClient;
var dbObject;
var bcrypt = require('bcrypt');
const saltRounds = 11;

//////////////////////
var questions = new Array();
var levels = new Array();
var cookie_test = new Array();
var cookie_set = new Array();
questions['code1'] =     {level: 0, file: "question1"};
questions['code2'] = {level: 1, file: "question2"};
/////////
var hints = new Array();
hints['code_hint_1'] = "Hint Text 1";
hints['code_hint_2'] = "Hint Text 2";
////////
// This will set specific cookie on specific code
cookie_set['code_1'] = {key: "key", value: "red"};
// This will test specific cookie on specific code
cookie_test['code_3'] = {key: "key", value: "blue"};
////////

var files = new Array();
for(var key in questions) {
  var content = fs.readFileSync('private/questions/' + questions[key].file + '.html', 'utf8');
  files[questions[key].file] = content;
  levels[questions[key].level] = key;
}

//////////////////////

MongoClient.connect("mongodb://localhost:27017/acc2", function(err, db) {
  if(!err) {
    dbObject = db;
  }
});

var codeContent = fs.readFileSync('private/code.html', 'utf8');

var redirectHome = function(res) {
  res.send("<script>window.location='/';</script>");
}

app.use('/api', router);

router.get('/level', function(req, res, next) {
  var username = req.cookies.username;
  var hash = req.cookies.session;

  signIn(username, hash, function(result, data) {
    if(data.level == null) data.level = 0;
    var code = levels[data.level];

    var code_level = getLevelByCode(code);
    setCookieByCode(res, code);
    var data = {level: code_level, username: data.username, question: getQuestion(code)};
    res.send(data);
  });
});

router.get('/level/:code', function(req, res, next) {
  var username = req.cookies.username;
  var hash = req.cookies.session;

  if(username == null) {
    res.send({status: "auth"});
    return;
  }

  console.log(req.params.code);

  signIn(username, hash, function(result, data) {
    if(data.level == null) data.level = 0;
    var code_level = getLevelByCode(req.params.code);
    if(code_level >= 0) {
      if(!checkCookieByCode(req, req.params.code)) {
        if(req.params.code in hints) {
          res.send({status: "nok", hint: hints[req.params.code]});
        } else {
          res.send({status: "nok"});
        }
        return;
      }
    }
    if(code_level == -1) {
      if(req.params.code in hints) {
        res.send({status: "nok", hint: hints[req.params.code]});
      } else {
        res.send({status: "nok"});
      }
    } else {
      if(code_level > data.level) {
        // save user progression
        var users = dbObject.collection('users');
        var timestamp = Math.floor(Date.now() / 1000);
        users.update({username: username}, {$set: {level: code_level, last_action: timestamp}}, function(err, object) {
          if (err){
              // do nothing
          }
      });
      }
      setCookieByCode(res, req.params.code);
      var data = {level: code_level, username: data.username, question: getQuestion(req.params.code)};
      res.send(data);
    }
  });
});

var checkCookieByCode = function(req, code) {
  if(code in cookie_test) {
    if(req.cookies[cookie_test[code].key] == cookie_test[code].value) {
      return true;
    } else {
      return false;
    }
  } else {
    return true;
  }
}

var setCookieByCode = function(res, code) {
  if(code in cookie_set) {
    res.cookie(cookie_set[code].key, cookie_set[code].value, {
        maxAge: 900000,
        httpOnly: false
    })
  }
}

var getLevelByCode = function(code) {
  if(code in questions) {
    return questions[code].level;
  }

  return -1;
}

var getQuestion = function(code) {
  if(code in questions) {
    var file = questions[code].file;
    if(file in files) {
      return files[file];
    }
  }

  return -1;
}

app.get('/leaderboard', function (req, res) {
  var users = dbObject.collection('users');
  users.find({level: 12}, {_id: 0, username: 1, reg_time: 1, last_action: 1}).sort({last_action: -1}).limit(100).toArray(function(err, data) {
    if(!err) {
      users.count(function(err, count) {
        if(!err) {
          res.send({arr: data, cnt: count});
        }
      });
    }
  });
});

app.get('/code', function (req, res) {
  var username = req.cookies.username;
  var hash = req.cookies.session;
  if(hash != null && username != null) {
      signIn(username, hash, function(result, data) {
        if(result == "ok") {
            res.send(codeContent);
        } else {
          redirectHome(res);
        }
      });
  } else {
      redirectHome(res);
  }
});

app.post('/signup', function (req, res) {
  var username = req.body.username;
  var password = req.body.password;

  var users = dbObject.collection('users');

  users.findOne({username: username}, function(err, data) {
    if(err) {
      res.send({status: "nok"});
    } else {
      if(data == null) {
        signUp(username, password, res);
      } else {
        res.send({status: "duplicate"});
      }
    }
  })
});

var signUp = function(username, password, res) {
  var users = dbObject.collection('users');

  bcrypt.hash(password, saltRounds, function(err, hash) {
    var timestamp = Math.floor(Date.now() / 1000);
    users.insertOne({username:username, password:hash, reg_time: timestamp}, function(err, result) {
      if(err) {
        res.send({status: "nok"});
      } else {
        res.cookie('session', hash, {
            maxAge: 90000000,
            httpOnly: false
        }).cookie('username', username, {
            maxAge: 90000000,
            httpOnly: false
        }).status(200).send({status: "ok"});
      }
    });
  });
}

app.post('/continue', function (req, res) {
  var username = req.body.username;
  var password = req.body.password;

  var users = dbObject.collection('users');

  signIn(username, password, function(result, data) {
    if(result == "ok") {
      res.cookie('session', data.password, {
          maxAge: 90000000,
          httpOnly: false
      }).cookie('username', username, {
          maxAge: 90000000,
          httpOnly: false
      }).status(200).send({status: "ok"});
    } else {
      res.send({status: result});
    }
  });
});

var signIn = function(username, password, handler) {
  var users = dbObject.collection('users');
  users.findOne({username: username}, function(err, data) {
    if(err) {
      handler("nok", null);
    } else {
      if(data == null) {
        handler("wrong", null);
      } else {
        if(password == data.password) {
          handler("ok", data);
        } else {
          bcrypt.compare(password, data.password, function(err, result) {
            if(err) {
              handler("nok", data);
            } else {
              if(result == true) {
                handler("ok", data);
              } else {
                handler("wrong", data);
              }
            }
          });
        }
      }
    }
  });
}


/////// additional special cases
app.get('/url1', function (req, res) {
  res.send("output1");
});
app.get('/url2', function (req, res) {
  res.send("output2");
});
////////

app.listen(80, function () {
  console.log('HTTP listening on port 80!')
})

// Server
/**
This is a special section that runs a socket io server for other parts of quest
**/
var io = require('socket.io').listen(2015);

var socket_in = new Array();
var socket_out = new Array();
socket_in = ["message1", "message1", "message1", "message1"];
socket_out = ["message1", "message1", "message1", "message1", "message1"];

io.on('connection', function(socket) {
  var state = 0;
  socket.emit("comm", socket_out[state]);
  socket.on('disconnect', function(msg) {

  });
  socket.on('comm', function(msg) {
    msg = msg.toLowerCase();
    if(msg == socket_in[state]) {
      state++;
      socket.emit("comm", socket_out[state]);
    } else {
      socket.disconnect('protocol failure');
    }
  });
  socket.on('super_secret', function(msg) {
    if(msg == "msg1") {
      socket.emit("super_secret", "msg1");
    } else if(msg == "msg1") {
      socket.emit("super_secret", "msg1");
    } else {
      socket.disconnect('protocol failure');
    }
  });
});
