import jsonServer from 'json-server';

/** DB */
import { findUser } from '../DB/index.js';

/** uuid */
import { v4 as uuid } from 'uuid';

/** Session */
import * as Session from '../Session/index.js';

/** Utils */
import { getCookieParams } from '../Utils/index.js';

/** @param {jsonServer.JsonServerRouter} router */
export const getAuthRoute = (router) => {
  router.post('/login', (req, res) => {
    console.log(req.body.email);
    const user = findUser(req.body.email);

    if (!user) {
      return res.status(500).send({ statusCode: 1101, message: 'Not found email.' });
    }

    const isSamePassword = user.password === req.body.password;

    if (!isSamePassword) {
      return res
        .status(500)
        .send({ statusCode: 1102, message: 'Bad request cause wrong password.' });
    }

    const newSessionId = uuid();

    Session.save(newSessionId, user);

    return res
      .cookie('COMP_SESSION_ID', newSessionId, {
        path: '/',
        maxAge: 3600000,
        sameSite: "none",
        httpOnly: true,
      })
      .sendStatus(200);
  });

  router.post('/logout', (req, res) => {
    const cookies = req.headers.cookie;

    if (!cookies) {
      return res.sendStatus(200);
    }

    const cookieParams = getCookieParams(cookies);
    const sessionId = cookieParams['COMP_SESSION_ID'];

    if (!sessionId) {
      return res.sendStatus(200);
    }

    Session.deleteSession(sessionId);

    return res.clearCookie('COMP_SESSION_ID').sendStatus(200);
  });

  router.get('/status', (req, res) => {
    const cookies = req.headers.cookie;

    if (!cookies) {
      return res.status(500).send({ statusCode: 1202, message: '쿠키에 세션값이 없음' });
    }

    const cookieParams = getCookieParams(cookies);
    const sessionId = cookieParams['COMP_SESSION_ID'];

    if (!sessionId) {
      return res.status(500).send({ statusCode: 1202, message: '쿠키에 세션값이 없음' });
    }

    const user = Session.get(sessionId);

    if (!user) {
      return res.status(500).send({ statusCode: 1203, message: '유효한 세션값이 아님' });
    }

    // console.log('받은 Session ID: ', sessionId);
    // console.log('유저 정보: ', user);

    const passedUser = { ...user };

    delete passedUser.id;
    delete passedUser.password;

    return res.status(200).send(passedUser);
  });

  return router;
};
