import jsonServer from 'json-server';
import { getMyComments, getMyCompliments, getReceiveCount, getWriteCount } from '../DB/index.js';

/** Session */
import * as Session from '../Session/index.js';

/** Utils */
import { getCookieParams } from '../Utils/index.js';

/** @param {jsonServer.JsonServerRouter} router */
export const getMypageRoute = (router) => {
  router.get('/compCount', (req, res) => {
    const cookies = req.headers.cookie;

    if (!cookies) {
      return res.status(500).send({ statusCode: 1201, message: '쿠키가 없' });
    }

    const cookieParams = getCookieParams(cookies);
    const sessionId = cookieParams['COMP_SESSION_ID'];

    if (!sessionId) {
      return res.status(500).send({ statusCode: 1202, message: '세션 쿠키가 없' });
    }

    const user = Session.get(sessionId);

    if (!user) {
      return res.status(500).send({ statusCode: 1203, message: '저장된 유저 정보가 없' });
    }

    return res.status(200).send({
      writeCompCount: getWriteCount(Number(user.id)),
      receiveCompCount: getReceiveCount(Number(user.id)),
    });
  });

  router.get('/compliment', (req, res) => {
    const cookies = req.headers.cookie;

    if (!cookies) {
      return res.status(500).send({ statusCode: 1201, message: '쿠키가 없' });
    }

    const cookieParams = getCookieParams(cookies);
    const sessionId = cookieParams['COMP_SESSION_ID'];

    if (!sessionId) {
      return res.status(500).send({ statusCode: 1202, message: '세션 쿠키가 없' });
    }

    const user = Session.get(sessionId);

    if (!user) {
      return res.status(500).send({ statusCode: 1203, message: '저장된 유저 정보가 없' });
    }

    const complimentList = getMyCompliments(Number(user.id));

    return res.status(200).send(complimentList);
  });

  router.get('/_comment', (req, res) => {
    const cookies = req.headers.cookie;

    if (!cookies) {
      return res.status(500).send({ statusCode: 1201, message: '쿠키가 없' });
    }

    const cookieParams = getCookieParams(cookies);
    const sessionId = cookieParams['COMP_SESSION_ID'];

    if (!sessionId) {
      return res.status(500).send({ statusCode: 1202, message: '세션 쿠키가 없' });
    }

    const user = Session.get(sessionId);

    if (!user) {
      return res.status(500).send({ statusCode: 1203, message: '저장된 유저 정보가 없' });
    }

    const commentList = getMyComments(Number(user.id));

    return res.status(200).send(commentList);
  });

  return router;
};
