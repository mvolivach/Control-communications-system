const User = require('../models/users');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Обробка помилок
const handleErrors = (err) => {
  console.log(err.message, err.code);
  let errors = { email: '', password: '' };

  // Невірний email
  if (err.message === 'incorrect email') {
    errors.email = 'Даний email ще не зареєстровано';
  }

  // Невірний пароль
  if (err.message === 'incorrect password') {
    errors.password = 'Даний пароль є невірним';
  }

  // Помилка дублювання email
  if (err.code === 11000) {
    errors.email = 'Даний email уже зареєстровано';
    return errors;
  }

  // Помилки валідації
  if (err.message.includes('user validation failed')) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }

  return errors;
}

const maxAge = 3 * 24 * 60 * 60; // Максимальний час життя токену

// Створення токену
const createToken = (id) => {
  return jwt.sign({ id }, 'my communication secret', {
    expiresIn: maxAge
  });
};

// Перевірка користувача
const checkUser = (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, 'my communication secret', async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        let user = await User.findById(decodedToken.id);
        res.locals.user = user;
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};

// Перевірка авторизації
const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(token, 'my communication secret', (err, decodedToken) => {
      if (err) {
        console.log(err.message);
        res.redirect('/login');
      } else {
        console.log(decodedToken);
        next();
      }
    });
  } else {
    res.redirect('/login');
  }
};

// Контролери дій
module.exports.signup_get = (req, res) => {
  res.render('signup');
}

module.exports.login_get = (req, res) => {
  res.render('login');
}

module.exports.signup_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ errors: { email: 'Email is already registered' } });
    }

    const user = await User.create({ email, password });
    const token = createToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(201).json({ user: user._id });
  } catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
}

module.exports.login_post = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);
    const token = createToken(user._id);
    res.cookie('jwt', token, { httpOnly: true, maxAge: maxAge * 1000 });
    res.status(200).json({ user: user._id });
  } 
  catch (err) {
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
}

module.exports.logout_get = (req, res) => {
  const filePath = path.join(__dirname, '..', 'token.json');
  
  // Видалення файлу токену
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') { 
      console.error("Помилка при видаленні файлу token.json:", err);
      return res.status(500).send("Помилка при виході з системи");
    }

    res.cookie('jwt', '', { maxAge: 1 });
    res.redirect('/');
  });
}

module.exports.checkUser = checkUser;
module.exports.requireAuth = requireAuth;
