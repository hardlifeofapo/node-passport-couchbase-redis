var cb = require("couchbase")
  , crypto = require('crypto')
  , common = require("../keys");


var User = function() {};

User.save = function (aUser, callback) {

  cb.connect(common.config, function( err, cb ){
    if( err ) {
      console.info("16");
      console.error(err);
    }else{
      var myKey = aUser.emailAddress;
      var shasum = crypto.createHash('sha1');
      shasum.update(aUser.password);
      aUser.password = shasum.digest('hex');
      
      User.findOne(myKey, function(error, existingUser){
        if(err) {
          //an error occurred
          callback("ERR_DB", null);
        } else if( existingUser ) {
          //user with that email already exists
          callback("ERR_USER_EXISTS", null);
        }else{
          //create user
          cb.set(myKey, JSON.stringify(aUser), function (err, meta) {
            if(err){
              console.error(err);
              callback("error", null);
            }else{
              console.info(meta);
              callback(null, meta);
            }
          });
        }
      });
    }
  });
}

User.findOne = function(username, callback) {
  cb.connect(common.config, function( err, cb ){
    if(err){
      callback("ERR_DB", null);
    }else{
      cb.get(username, function (error, doc, meta) {
        if(error){
          console.info(error);
          callback(null, false);
        }else if(doc){
          console.info(doc);
          console.info(meta);
          callback(null, doc);
        }
      });
    }
  });

};


User.authenticate = function (username, password, callback) {
  console.info("User.authenticate");
  console.info(username);
  console.info(password);
  
  User.findOne(username, function(error, aUser){
    if(error){
      return callback(null, false);
    }else{
      if(!aUser){
        callback(null, false);
      }else{
        var shasum = crypto.createHash('sha1');
        shasum.update(password);
        input_pass = shasum.digest('hex');
        
        if(aUser.password == input_pass){
          aUser.verifiedPass = true;
          return callback(null, aUser);
        }else{
          aUser.verifiedPass = false;
          return callback(null, aUser);
        }
      }
    }
  });
  
};


module.exports = User;
