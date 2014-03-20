var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , path = require('path')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , RedisDB = require('redis')
  , User = require('./models/User')
  , routes = require('./routes')
  , index = require('./routes/index')
  , users = require('./routes/users')
	, session = require('express-session')
	, RedisStore = require('connect-redis')(session);
  

// configure Express
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(passport.initialize());
  // Redis will store sessions
	app.use(session({ store: new RedisStore(), secret: 'keyboard cat', cookie: { secure: false, maxAge:86400000 } } ));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  console.info("passport.serializeUser");
  console.info(user);
  done(null, user.emailAddress);
});

passport.deserializeUser(function(username, done) {
  // Use User model to retrive the user from the database
  User.findOne(username, function (err, user) {
    console.info("passport.deserializeUser");
    console.info(user);
    done(err, user);
  });
});

// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.

passport.use(new LocalStrategy( { usernameField: 'email', passwordField: 'password' },
  function(username, password, done) {
    process.nextTick(function() {
      User.authenticate(username, password, function (error, result) {
        console.info("locastrategy");
        console.info(error);
        console.info(result);
        if (error) {
          return done(error);
        } else {
          if (!result) {
            return done(null, false, { message: 'Invalid credentials' });
          }else if(!result.verifiedPass){
            return done(null, result, { message: 'Invalid password' });
          }
          return done(null, result);            
        }
      });
    });
}));
  

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login');
}



app.get('/', ensureAuthenticated, function(req, res){
  res.render('index', { user: req.user });
});


app.get('/login', function(req, res){
  res.render('login');
});
app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      console.info("103");
      console.info(info);
      return res.render('login', { "user": req.user, "message": info.message });
    }else if(!user.verifiedPass){
      console.info("104");
      return res.render('login', { "user": req.user, "message": info.message });
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect("/");
    });
  })(req, res, next);
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect("/login");
});


app.post('/register', users.createAccount);
app.get('/register', function(req, res){
  res.render('register');
});


/* Run server  */
server.listen(3000);