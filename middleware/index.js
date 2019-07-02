var Comment = require("../models/comment");
var Campground = require("../models/campground");
var User = require("../models/user");
var middlewareObject = {};

middlewareObject.isLoggedIn = function(req,res,next) {
    if (req.isAuthenticated()) {
        return next();    
        }
    req.flash("error","You need to be logged in!!");    
    res.redirect("/login");    
    }; 

middlewareObject.checkCommentOwnership = function (req,res,next) {
    if (req.isAuthenticated()) {
        Comment.findById(req.params.comment_id,function(err,foundComment) {
            if (err) {
                req.flash("error",err.message);
                return res.redirect("back");        
                }
            if (!foundComment) {
                req.flash("error", "Item not found.");
                return res.redirect("back");
                }    
            else {
                if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                    }
                else {
                    req.flash("error","You don't have the permission to do that!");
                    res.redirect("back");
                    }    
                }    
            });
        }
    else {
        req.flash("error","You need to be logged in to do that!");
        res.redirect("back");
        }
    }; 
    
middlewareObject.checkProfileOwnership = function (req,res,next) {
    if (req.isAuthenticated()) {
        User.findById(req.params.id,function(err,foundUser) {
            if (err) {
                req.flash("error",err);
                res.redirect("back");        
                }  
            else {
                console.log(req.user._id);
                console.log(foundUser);
                if (foundUser._id.equals(req.user._id) || req.user.isAdmin){
                    next();
                    }
                else {
                    req.flash("error","You can see only your profile, for now!");
                    res.redirect("/campgrounds");
                    }    
                }    
            });
        }
    else {
        req.flash("error","You need to be logged in to do that!");
        res.redirect("/login");
        }
    };     

middlewareObject.checkCampgroundOwnership = function(req,res,next) {
    if (req.isAuthenticated()) {
        Campground.findOne({slug: req.params.slug},function(err,foundCampground) {
            if (err) {
                req.flash("error","Campground not found!");
                res.redirect("back");        
                }
            if (!foundCampground) {
                req.flash("error", "Item not found.");
                return res.redirect("back");
                }    
            else {
                if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin){
                    next();
                    }
                else {
                    req.flash("error","You don't have permission to do that!");
                    res.redirect("back");
                    }    
                }    
            });
        }
    else {
        req.flash("error","You need to be logged in to do that!");
        res.redirect("back");
        }
    };
    

module.exports = middlewareObject;    