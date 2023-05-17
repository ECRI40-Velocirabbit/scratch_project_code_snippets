const passport = require('../authConfig/passport.js');
const User = require('../models/userModel.js');
const bcrypt = require('bcrypt');
const authenticationController = {};


//Error creator method specific to this controller
const createError = (method, log, status, message = log) => {
  return {
    log: `Error occurred in authenticationController.${method}: ${log}`,
    status,
    message: { err: message }
  };
};

//Authentication and user creation methods go here.
//Feel free to change these as you see fit -- I just have them in here for testing purposes.
authenticationController.signUp = async (req, res, next) => {
  const { username, password } = req.body;
  try {
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return next({
        log: 'Error occured in authenticationController.signUp',
        status: 400,
        message: 'Username already exists, please select another'
      });
    }

    // password encryption
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt);

    const newUser = await User.create({
      username: req.body.username,
      password: hashedPassword,
    });
    res.locals.newUser = newUser;
    return next();
  } catch (err) {
    return next(err);
  }
};

authenticationController.getUserData = (req, res, next) => {
  const { _id } = req.query;
  User.findById(_id)
    .exec()
    .then((user) => {
      res.locals.userData = user;
      return next();
    })
    .catch((err) => {
      return next(
        createError('getUserData', `Error retrieving user data: ${err}`, 500)
      );
    });
};

authenticationController.Null = async (req, res, next) => {
  try {
    await passport.authenticate('signup', {session: false}, (err, user) => {
      if (err) {
        throw err;
      }
      if (!user) {
        return res.status(400).json({message: 'Signup failed, please input a valid username'});
      }
      const jwt = require('jsonwebtoken');
      const { jwtSecret, jwtExpirtation } = require('../authConfig/config') ;

      const token = jwt.sign({ id: user._id}, jwtSecret, {
        expiresIn: jwtExpirtation,
      });

      req.token = token;
      req.user = user;
      res.locals.user = user;

      return next();
    }) (req, res, next);
  } catch (err) {
    return next(
      createError('signUp', `Error with signUp ${err}`, 500)
    );
  }
};


module.exports = authenticationController;
