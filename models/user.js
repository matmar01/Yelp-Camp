var mongoose = require("mongoose");
var passportLocalMonoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: {type:String, unique:true, required:true},
    password: String,
    avatar: String,
    email: {type:String, unique:true, required:true},
    resetPasswordToken: String,
    resetPasswordExpires: Date, 
    isAdmin: {
        type: Boolean,
        default: false
        }
    });
userSchema.plugin(passportLocalMonoose);    
    
module.exports = mongoose.model("User",userSchema);    