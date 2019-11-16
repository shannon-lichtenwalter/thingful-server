const express = require('express');
const usersRouter = express.Router();
const jsonBodyParser = express.json();
const UsersService = require('./users-service');
const path = require('path');

usersRouter
  .post('/', jsonBodyParser, (req, res, next) => {
    const { user_name, password, full_name, nickname } = req.body;
    const newUser = { user_name, password, full_name };

    for (const [key, value] of Object.entries(newUser))
      if (!value) {
        return res.status(400).json({ error: `Missing '${key}' in request body` });
      }
    newUser.nickname = nickname;
    newUser.date_created = 'now()';

    const passwordError = UsersService.validatePassword(password);
    if (passwordError) {
      return res.status(400).json({ error: passwordError });
    }
    UsersService.hasUserWithUserName(
      req.app.get('db'),
      user_name
    )
      .then(hasUserWithUserName => {
        if (hasUserWithUserName)
          return res.status(400).json({ error: 'Username already taken' });
        return UsersService.hashPassword(password)
          .then(hashedPassword => {
            newUser.password = hashedPassword;

            return UsersService.insertUser(
              req.app.get('db'),
              newUser
            )
              .then(user => {
                return res
                  .status(201)
                  .location(path.posix.join(req.originalUrl, `/${user.id}`))
                  .json(UsersService.serializeUser(user));
              });
          });
      })
      .catch(next);
  });

module.exports = usersRouter;