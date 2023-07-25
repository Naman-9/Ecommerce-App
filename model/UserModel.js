const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: [true, "Email Already Exists."]
    },
    password: {
        type: Buffer,
        required: true,
    },
    role: {
        type: String,
        required: true, 
        default: 'user'
    },
    addresses: {
        type: [Schema.Types.Mixed],
    },
    name: {
        type: String,
    },
    salt:Buffer,
    resetPasswordToken: {type: String, default: ''
},
});

const virtual = UserSchema.virtual('id');
virtual.get(function() {
    return this._id;
})
UserSchema.set('toJSON', { 
    virtuals: true,
    versionkey: false,
    transform: function(doc, ret) {delete ret._id}                // ------- doc -- savedProduct
})

exports.User = mongoose.model("User", UserSchema);