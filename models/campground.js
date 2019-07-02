var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
    name: {
        type: String,
        required: "Campground name cannot be blank",
        unique: "A campground with that name already exists"
        },
    slug: {
        type: String,
        unique: true
        },    
    price: Number,
    image: String,
    imageId: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    createdAt: {
        type: Date,
        default: Date.now
        },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
            }, 
        username: String
        },
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
        }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
        }]    
    });

campgroundSchema.pre('save',async function(next) {
    try {
        if (this.isNew || this.isModified("name")) {
            this.slug = await generateUniqueSlug(this._id,this.name);
            }
        }
    catch(err) {
        next(err);
        }    
    });

var Campground = mongoose.model("Campground", campgroundSchema);

module.exports = Campground;


async function generateUniqueSlug(id, campground) {
    do {
        check = true;
        let slug =  campground.toString().toLowerCase()
            .replace(/\s+/g, '-')        // Replace spaces with -
            .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
            .replace(/\-\-+/g, '-')      // Replace multiple - with single -
            .replace(/^-+/, '')          // Trim - from start of text
            .replace(/-+$/, '')          // Trim - from end of text
            .substring(0, 20);           // Trim at 75 characters
        slug += "-" + Math.floor(1000 + Math.random() * 9000); 
        var campground = await Campground.findOne({slug:slug});
        if (!campground || campground._id.equals(id)) {
            check = false;
            return slug;
            }
        }while(check === true);
    }