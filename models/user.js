var mongoose = require("mongoose");
var passportLocalMonoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: String,
    password: String
    });
userSchema.plugin(passportLocalMonoose);    
    
module.exports = mongoose.model("User",userSchema);    