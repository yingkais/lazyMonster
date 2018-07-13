var numeral = require('numeral');
var bcrypt = require('bcrypt-nodejs');
var dateFormat = require('dateformat');
var PythonShell = require('python-shell');
var fs = require('fs');
var mkdirp = require('mkdirp');
var multer = require('multer');
var path = require('path');

exports.loggedIn = function(req, res, next) {
  if (req.session.user) { // req.session.passport._id
    next();
  } else {
    res.redirect('/login');
  }
}

exports.home = function(req, res) {
  res.render('home.ejs', {
    error: req.flash("error"),
    success: req.flash("success"),
    session: req.session,
  });
}

exports.signup = function(req, res) {
  if (req.session.user) {
    res.redirect('/home');
  } else {
    res.render('signup', {
      error: req.flash("error"),
      success: req.flash("success"),
      session: req.session
    });
  }
}

exports.login = function(req, res) {
  if (req.session.user) {
    res.redirect('/home');
  } else {
    res.render('login', {
      error: req.flash("error"),
      success: req.flash("success"),
      session: req.session
    });
  }
}

exports.upload = function(req, res) {
    // var dir_name = Date.now();
    // mkdirp('uploads/' + dir_name, function(err) {
    //   var storage = multer.diskStorage({
    //     destination: 'uploads/' + dir_name,
    //     filename: function ( req, file, cb ) {
    //         cb(null, file.originalname);
    //     }
    //   });
    //   var upload = multer({ storage: storage }).any();
    //   upload(req, res, function(err) {
    //       if(err) {
    //           return res.end("Error uploading file.");
    //       }
    //       else {
    //         var files = req.files;
    //         for (var i = 0; i < files.length; i++) {
    //           console.log('type %s', files[i].mimetype);
    //           console.log('original name：%s', files[i].originalname);
    //           console.log('size：%s', files[i].size);
    //           console.log('save path：%s', files[i].path);
    //         }
    //         res.send("Success.");
    //       }
    //   });
    // });
    var options = {
      mode: 'json',
      pythonOptions: ['-u'], // get print results in real-time
      scriptPath: path.join(__dirname + "../../../python"),
      args: ['value1', 'value2']
    };
    var shell = new PythonShell('py.py', options);
    shell.on('message', function (message) {
      console.log(message);
    });
    shell.end(function (err) {
      console.log('The script work has been finished.');
      if(err) { res.status(200).send({ error: err }); }
      else { res.status(200).send({ message : 'Success' }); }
    });
}
