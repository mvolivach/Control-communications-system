const mongoose = require('mongoose');
const { isEmail } = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Будь ласка, введіть email'],
    unique: true,
    lowercase: true,
    validate: [isEmail, 'Будь ласка, введіть правильний email']
  },
  password: {
    type: String,
    required: [true, 'Будь ласка, введіть пароль'],
    validate: {
      validator: function(value) {
        const hasNumber = /\d/.test(value);
        const hasLowercase = /[a-z]/.test(value);
        const hasUppercase = /[A-Z]/.test(value);
        return hasNumber && hasLowercase && hasUppercase;
      },
      message: 'Пароль повинен містити принаймні одну цифру, маленьку та велику літеру'
    },
    minlength: [8, 'Пароль має містити мінімум 8 символів'],
  },
  
});

userSchema.pre('save', async function(next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.statics.login = async function(email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error('incorrect password');
  }
  throw Error('incorrect email');
};

const User = mongoose.model('user', userSchema);

module.exports = User;