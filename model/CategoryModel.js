const mongoose = require("mongoose");
const { Schema } = mongoose;

const CategorySchema = new Schema({
    label: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: String,
        required: true,
        unique: true

    },
    
});

const virtual = CategorySchema.virtual('id');
virtual.get(function() {
    return this._id;
})
CategorySchema.set('toJSON', { 
    virtuals: true,
    versionkey: false,
    transform: function(doc, ret) {delete ret._id}                // ------- doc -- savedProduct
})

exports.Category = mongoose.model("Category", CategorySchema);