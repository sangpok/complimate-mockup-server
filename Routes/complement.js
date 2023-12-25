import jsonServer from 'json-server';

/** DB */
import {
  countUpReply,
  createComment,
  createCommentLike,
  createPost,
  createPostLike,
  deleteCommentLike,
  deletePostLike,
  findPostLike,
  getComment,
  getCommentLike,
  getCommentLikes,
  getComments,
  getComplement,
  getComplementDetail,
  getComplements,
  getUser,
  updatePostLike,
} from '../DB/index.js';

/** Session */
import * as Session from '../Session/index.js';

/** Utils */
import { getCookieParams } from '../Utils/index.js';

/** @param {jsonServer.JsonServerRouter} router */
export const getComplementRoute = (router) => {
  router.get('/get', (req, res) => {
    const queryParams = req.query;

    const pageSize = Number(queryParams?.pageSize) || 10;
    const lastViewId = Number(queryParams?.lastViewId) || 0;

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

    const complements = getComplements(user.id, pageSize, lastViewId);

    return res.status(200).send(complements);
  });

  router.get('/:complimentId', (req, res) => {
    // const queryParams = req.query;

    // const pageSize = Number(queryParams?.pageSize) || 10;
    // const lastViewId = Number(queryParams?.lastViewId) || 0;

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

    const { complimentId } = req.params;

    const compliment = getComplementDetail(Number(complimentId), Number(user.id));

    return res.status(200).send(compliment);
  });

  router.post('/create', (req, res) => {
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

    if (!req.body?.contents || !req.body?.mediaUrlList) {
      return res.status(500).send({ statusCode: 1204, message: '전송된 데이터가 잘못됐' });
    }

    const { contents, mediaUrlList } = req.body;
    const complementId = createPost({ memberId: user.id, contents, mediaUrlList });

    return res.status(200).send({ complementId });
  });

  router.get('/:complementId/comment', (req, res) => {
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

    const { complementId } = req.params;

    const queryParams = req.query;
    const parentId = queryParams?.parentId ? Number(queryParams.parentId) : null;

    const commentsRaw = getComments(Number(complementId), parentId);
    const comments = commentsRaw.map((comment) => {
      const newComment = { ...comment };

      const commentLikes = getCommentLikes(comment.id);
      const isLiked = commentLikes.find(({ memberId }) => memberId === user.id) !== undefined;
      const commentWriter = { ...getUser(comment.memberId) };

      delete commentWriter.id;
      delete commentWriter.email;
      delete commentWriter.password;

      delete newComment.memberId;
      delete newComment.postId;

      return {
        ...newComment,
        isLiked,
        likeCount: commentLikes.length,
        writer: { ...commentWriter },
      };
    });

    const commentsWithLike = comments
      .filter(({ likeCount }) => likeCount > 0)
      .sort((a, b) => a.createdAt - b.createdAt);
    const commentsWithNoLike = comments
      .filter(({ likeCount }) => likeCount === 0)
      .sort((a, b) => a.createdAt - b.createdAt);

    return res.status(200).send([...commentsWithLike, ...commentsWithNoLike]);
  });

  router.post('/:complementId/comment', (req, res) => {
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

    if (!req.body?.contents) {
      return res.status(500).send({ statusCode: 1204, message: '전송된 데이터가 잘못됐' });
    }

    const bodyParams = req.body;

    if (!bodyParams?.contents) {
      return res.status(500).send({ statusCode: 1204, message: '전송된 데이터가 잘못됐' });
    }

    const { complementId } = req.params;
    const postId = Number(complementId);

    const { contents } = bodyParams;

    console.log({ bodyParams });

    if (bodyParams?.parentId === undefined) {
      const commentId = createComment({
        postId,
        memberId: user.id,
        contents,
        parentCommentId: null,
      });
      return res.status(200).send({ commentId });
    }

    const { parentId } = bodyParams;

    console.log({ parentId });

    const parentComment = getComment(Number(parentId));

    if (!parentComment) {
      return res.status(500).send({ statusCode: 1204, message: '전송된 데이터가 잘못됐' });
    }

    const commentId = createComment({
      postId,
      memberId: user.id,
      contents,
      parentCommentId: parentComment.id,
    });

    countUpReply(parentComment.id);

    return res.status(200).send({ commentId });
  });

  router.post('/:complementId/like', (req, res) => {
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

    if (!req.body?.likeType) {
      return res.status(500).send({ statusCode: 1204, message: '전송된 데이터가 잘못됐' });
    }

    const { complementId } = req.params;
    const { likeType } = req.body;

    const prevLike = findPostLike(Number(complementId), Number(user.id));

    console.log({ prevLike });

    if (prevLike) {
      if (prevLike.likeType === likeType) {
        deletePostLike(prevLike.id);
      } else {
        updatePostLike(prevLike.id, likeType);
      }
      return res.status(200).send({ postLikeId: prevLike.id });
    } else {
      const postLikeId = createPostLike(Number(complementId), user.id, likeType);

      return res.status(200).send({ postLikeId });
    }
  });

  router.post('/:complementId/comment/:commentId/like', (req, res) => {
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

    if (!req.body?.likeType) {
      return res.status(500).send({ statusCode: 1204, message: '전송된 데이터가 잘못됐' });
    }

    const { commentId } = req.params;
    const { likeType } = req.body;

    const alreadyLiked = getCommentLike(Number(commentId), Number(user.id));
    const isAlreadyLiked = alreadyLiked !== undefined;

    if (isAlreadyLiked) {
      deleteCommentLike(alreadyLiked.id);
    } else {
      const newCommentLikeId = createCommentLike(Number(commentId), Number(user.id), likeType);
    }

    return res.sendStatus(200);
  });

  return router;
};
