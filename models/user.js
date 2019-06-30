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
        },
    notifications: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notification"
        }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
        }]    
    });
userSchema.plugin(passportLocalMonoose);    
    
module.exports = mongoose.model("User",userSchema);    