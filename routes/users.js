var User = require("../models/User");

/*
 * GET users listing.
 */

exports.list = function(req, res){
  res.send("respond with a resource");
};

exports.login = function(req, res){
  console.info("login");
  res.render('login', { title: 'Express' });
};


exports.createAccount = function(req, res){
  console.info("====CREATE ACCOUNT====");
  console.info(req.body);
  
  User.findOne(req.body.emailAddress, function(err, data){
    if(data){
       return res.render("register", { message: 'The email is already used' });
    }else{
      
      var aUser = {};
      aUser.userName = req.body.username;
      aUser.password = req.body.password;
      aUser.emailAddress = req.body.emailAddress;
      
      console.info(aUser);
      
      User.save(aUser, function(err, meta){
        if(err){
          console.error(err);
          if(err == "ERR_DB"){
            return res.send(500);
          }else if(err == "ERR_USER_EXISTS"){
            return res.redirect("/", { message: 'The email is already used' });
          }
        }else{
          req.logIn(aUser, function(err) {
            if(err){
              console.error(err);
              return res.send(500);
            }else{
              return res.redirect("/");
            }
          });
        }
      });
    }
  });
};
