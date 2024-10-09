const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

//This is the schema for users signup process

const userSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        required: true,
        default: false
    },
    role:{
        type:String,
        required:true,
        default:'user',
        enum:['admin','user']
    }
})

//Encrypting the password before storing it

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, 10);
    }

    next();
});

//Method to compare the two hash tokens are same or not(For passwords of the user)

userSchema.methods.comparePassword = async function (password) {
    const result = await bcrypt.compare(password, this.password);
    return result;
};

//Model Creation

module.exports = mongoose.model('User', userSchema)

