//app/models/user.js
//load the things we need
var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');

//define the schema for our user model
var userSchema = mongoose.Schema({
    name: String,
    mail: {
        type: String,
        unique: true,
        required: true,
        dropDups: true
    },
    password: String,
    status: String,
    created_date: {
        type: Date,
        default: new Date()
    },
    updated_date: {
        type: Date,
        default: new Date()
    },
    active_hash: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date
});


//methods ======================
//generating a hash
userSchema.methods.generateHash = function (password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//checking if password is valid
userSchema.methods.validPassword = function (password) {
    return bcrypt.compareSync(password, this.password);
};

//create the model for users and expose it to our app
module.exports = mongoose.model('ex_users', userSchema);
