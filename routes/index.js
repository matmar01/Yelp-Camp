var express = require("express");
var router = express.Router();
var User = require("../models/user");
var Campground = require("../models/campground");
var Notification = require("../models/notification");
var async = require("async");
var nodemailer = require("nodemailer");
var mg = require('nodemailer-mailgun-transport');
var crypto = require("crypto");
var passport = require("passport");
var middleware = require("../middleware");

router.get("/",function(req,res) {
    res.render("landing");
    });
    
//AUTH ROUTS
router.get("/register",function(req, res) {
    res.render("register",{page: "register"});
    });
router.post("/register",function(req, res) {
    var newUser = new User({username:req.body.username,avatar:req.body.avatar,email:req.body.email});
    if (req.body.adminCode === "123456") {
        newUser.isAdmin = true;    
        }
    User.register(newUser,req.body.password,function(err,user) {
        if (err) {
            req.flash("error",err.message);  
            return res.redirect("register");
            }
        passport.authenticate("local")(req,res,function(){
            req.flash("success","Welcome to Yelp camp "+ user.username + "!");
            res.redirect("/campgrounds");
            });    
        });
    });
router.get("/login",function(req, res) {
    res.render("login",{page: "login"});
    });

//app.post("/route",middleware,callback);    
router.post("/login",passport.authenticate("local",{failureRedirect: "/login",failureFlash: "Wrong Username or Password"}),function(req, res) {
    req.flash("success","Welcome back " + req.user.username);
    res.redirect("/campgrounds");
    });    
router.get("/logout",function(req, res) {
    req.logout();
    req.flash("success","Logged You Out!");
    res.redirect("/campgrounds");
    });  
//Reset password 
router.get("/resetPassword",function(req, res) {
    res.render("resetPassword");
    });
router.get("/resetPassword/:token",function(req, res) {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() }},function(err, user) {
        if (!user || err) {
            req.flash("error","Password reset token expired or no User");
            return res.redirect('/resetPassword');
            }
        return res.render("reset",{token: req.params.token});
        });
    });    
router.post("/resetPassword",function(req,res,next) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20,function(err,buf) {
                var token = buf.toString('hex');
                done(err,token);
                });        
            },
        function(token,done) {
            User.findOne({email:req.body.email},function(err,user) {
                if (!user || err) {
                    req.flash("error","No account with this email was found!");
                    return res.redirect("/resetPassword");
                    }  
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; //60*60*1000 = 1 hour
                user.save(function(err) {
                    done(err,token,user);
                    });
                });
            }, 
        function(token,user,done) {
            // Gmail
            // var smtpTransport = nodemailer.createTransport({
            //     service: 'Gmail',
            //     auth: {
            //         user: 'mmaric1710@gmail.com',
            //         pass: process.env.GMAILPASS
            //         }
            //     });
            // var mailOptions = {
            //     to: user.email,
            //     from: 'mmaric1710@gmail.com',
            //     text: "Please click the link to reset your password." + '\n' +
            //         'http://' + req.headers.host + '/resetPassword/' + token + '\n\n'
            //     }; 
            // smtpTransport.sendMail(mailOptions,function(err) {
            //     console.log(err);
            //     console.log('mail sent');
            //     req.flash("success","An e-mail has been sent to " + user.email + " with further instructions!");
            //     done(err,'done');
            //     });
            //
            // Mailgun
            var auth = {
                auth: {
                    api_key: process.env.MAILGUN_APIKEY,
                    domain: process.env.MAILGUN_DOMAIN
                    }
                };   
            var nodemailerMailgun = nodemailer.createTransport(mg(auth));
            nodemailerMailgun.sendMail({
                from: 'info@yelpCamp.org',
                to: user.email, // An array if you have multiple recipients.
                subject: 'New password for ' + user.username,
                text: "Please click the link to reset your password." + '\n' +
                    'http://' + req.headers.host + '/resetPassword/' + token + '\n\n'
                }, function (err, info) {
                    if (err) {
                        console.log('Error: ' + err);
                        }
                    else {
                        console.log('Response: ' + info);
                        res.redirect("/resetPassword");
                        }
                });
    

            }, 
        function (err) {
            if (err) {
                return next(err);
                }        
            res.redirect("/resetPassword");    
            }    
        ]);
    });    
router.get("/resetPassword/:token",function(req,res) {
    User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}},function(err,foundUser) {
        if (err) {
            console.log(err);        
            }  
        if (!foundUser) {
            req.flash("error","Password reset token is invalid or expired");
            return res.redirect("/resetPassword");
            }    
        res.render('reset',{token: req.params.token});    
        });
    });
router.post("/resetPassword/:token",function(req,res) {
    async.waterfall([
        function(done) {
            User.findOne({resetPasswordToken: req.params.token,resetPasswordExpires: {$gt: Date.now()}},function(err,foundUser) {
                if (!foundUser || err) {
                    req.flash("error","User not found or token expired!");
                    return res.redirect("back");
                    }
                if (req.body.password === req.body.confirm) {
                    foundUser.setPassword(req.body.password , function() {
                        foundUser.resetPasswordExpires = undefined;
                        foundUser.resetPasswordToken = undefined;
                        foundUser.save(function() {
                            req.logIn(foundUser,function(err) {
                                done(err,foundUser);
                                });                   
                            });
                        });           
                    }
                else {
                    req.flash("error","Passwords do not match!");
                    return res.redirect("back");
                    }    
                });        
            },
        function(user,done) {
            var auth = {
                auth: {
                    api_key: process.env.MAILGUN_APIKEY,
                    domain: process.env.MAILGUN_DOMAIN
                    }
                };   
            var nodemailerMailgun = nodemailer.createTransport(mg(auth));
            nodemailerMailgun.sendMail({
                from: 'info@yelpCamp.org',
                to: user.email, // An array if you have multiple recipients.
                subject: user.username + 'Your password has been changed',
                text: "Hello \n this is just a confirmation mail \n "
                }, function (err, info) {
                    if (err) {
                        console.log('Error: ' + err);
                        }
                    else {
                        req.flash("success","Your password has been changed");
                        done(err);
                        }
                });
            },
        function(err) {
            if (err) {
                req.flash("error",err.message);
                return res.redirect('back');            
                }
            res.redirect("/campgrounds");
            }    
        ]);
    });    
//Users Profiles    
router.get("/users/:id",middleware.isLoggedIn,function(req, res) {
    User.findById(req.params.id,function(err,foundUser) {
        if (err) {
            req.flash("error","Something went wrong");
            res.redirect("back");
            }
        else {
            Campground.find().where("author.id").equals(foundUser._id).exec(function(err,campgrounds) {
                if (err) {
                    req.flash("error","Something went wrong");
                    res.redirect("back");
                    }
                else {
                    res.render("users/show",{user:foundUser,campgrounds:campgrounds});
                    }
                });    
            }    
        });
    });
//Notifications routes
router.get("/follow/:id",middleware.isLoggedIn,async function(req, res) {
    try {
        let user = await User.findById(req.params.id);
        user.followers.push(req.user._id);
        user.save();
        req.flash("success","You now follow " + user.username);
        res.redirect("/users/" + req.params.id);
        }
    catch(err) {
        req.flash("error",err.message);
        res.redirect("back");
        }    
    });
router.get("/notifications",middleware.isLoggedIn,async function(req, res) {
    try {
        let user = await User.findById(req.user._id).populate({
            path: "notifications",
            options: {
                sort: { "_id" : -1}
                }                
            }).exec();
        let allNotifications = user.notifications;
        if (allNotifications) {
            res.render("notifications/index",{allNotifications});
            }
        else {
            res.render("notifications/index",{allNotifications: []});      
            }    
        }
    catch(err) {
        req.flash("error",err.message);
        res.redirect("back");
        }    
    });   
router.get("/notifications/:id",middleware.isLoggedIn,async function(req, res) {
    try {
        let notification = await Notification.findById(req.params.id);
        notification.isRead = true;
        notification.save();
        res.redirect("/campgrounds/"+notification.campgroundId);
        }
    catch(err) {
        req.flash("error",err.message);
        res.redirect("back");    
        }        
    });    

module.exports = router;    