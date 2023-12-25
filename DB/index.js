/** Lowdb */
import { JSONPreset } from 'lowdb/node';

const defaultData = {
  members: [
    {
      id: 0,
      email: '',
      password: '',
      nickname: '',
      profileUrl: '',
    },
  ],
  posts: [
    {
      id: 0,
      memberId: 0,
      createdAt: '',
      contents: '',
    },
  ],
  medias: [
    {
      id: 0,
      postId: 2,
      mediaUrl: '/tet.jpg',
      mediaType: 'IMAGE',
    },
  ],
  comments: [
    {
      id: 0,
      postId: 0,
      memberId: 1,
      parentCommentId: 0,
      createdAt: '1698748661320',
      contents: '돼지에서 벗어난 거 축하해~',
    },
  ],
  postLikes: [
    {
      id: 0,
      postId: 0,
      memberId: 1,
      likeType: 'LIKE',
    },
  ],
  commentLikes: [
    {
      id: 0,
      commentId: 0,
      memberId: 2,
      likeType: 'LIKE',
    },
  ],
};

const db = await JSONPreset('db.json', defaultData);

/* #region  members */
const updateMembers = (newData) => {
  db.data.members = [...db.data.members.filter(({ id }) => id !== newData.id), newData];
  db.write();
};

export const findUser = (target) => db.data.members.find(({ email }) => email === target);
export const hasEmail = (target) => !!findUser(target);
export const hasNickname = (target) =>
  !!db.data.members.find(({ nickname }) => nickname === target);

export const getUser = (userId) => db.data.members.find(({ id }) => id === userId);

export const createUser = (userData) => {
  const newUser = {
    id: db.data.members.length,
    ...userData,
    profileUrl: `${Math.floor(Math.random() * 10) + 1}.webp`,
  };

  db.data.members.push(newUser);
  db.write();
};

export const deleteUser = (userId) => {
  db.data.members = [...db.data.members.filter(({ id }) => id !== userId)];
  db.write();
};

export const updateUser = (newUserData) => {
  updateMembers(newUserData);
};
/* #endregion */

export const getComplement = (postId) => db.data.posts.find(({ id }) => id === postId);

export const getComplementDetail = (param, userId) => {
  let complement = null;

  if (typeof param === 'number') {
    complement = getComplement(param);
  } else {
    complement = param;
  }

  const postLikes = getPostLikes(complement.id);
  const writer = { ...getUser(complement.memberId) };
  const medias = getMedias(complement.id);

  delete writer.id;
  delete writer.email;
  delete writer.password;

  const commentsRaw = getComments(complement.id);
  const comments = commentsRaw.map((comment) => {
    const newComment = { ...comment };

    const commentLikes = getCommentLikes(comment.id);
    const isLiked = commentLikes.find(({ memberId }) => memberId === userId) !== undefined;
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

  const totalCommentCount = comments.length;
  const bestCommentList = [...comments].sort((a, b) => b.likeCount - a.likeCount).slice(0, 3);

  let newComplement = { ...complement };

  newComplement = {
    ...newComplement,
    totalLikeCount: postLikes.length,
    likeList: ['LIKE', 'PRAY', 'LAUGH_WITH_SAD', 'HEART_EYES', 'ANGEL_SMILE'].map((likeType) => ({
      likeType,
      likeCount: postLikes.filter(({ likeType: lt }) => lt === likeType).length,
      isLiked:
        postLikes.filter(({ likeType: lt, memberId }) => lt === likeType && memberId === userId)
          .length !== 0,
    })),

    writer,
    bestCommentList,
    mediaUrlList: medias,
    totalCommentCount,
  };

  delete newComplement.memberId;

  return newComplement;
};

export const getComplements = (userId, pageSize = 10, lastViewId = 0) => {
  const startViewIndex = db.data.posts.findIndex(({ id }) => id === lastViewId);

  const complementsRaw = db.data.posts.slice(startViewIndex, startViewIndex + pageSize);
  const mutatedComplements = complementsRaw.map((complement) =>
    getComplementDetail(complement, userId)
  );

  return mutatedComplements;
};

export const getComment = (commentId) => db.data.comments.find(({ id }) => id === commentId);

export const getComments = (targetPostId, targetParentCommentId = null) => {
  if (targetParentCommentId !== null) {
    return db.data.comments.filter(
      ({ postId, parentCommentId }) =>
        postId === targetPostId && parentCommentId === targetParentCommentId
    );
  } else {
    return db.data.comments.filter(
      ({ postId, parentCommentId }) => postId === targetPostId && parentCommentId === null
    );
  }
};

export const getPostLikes = (targetPostId) =>
  db.data.postLikes.filter(({ postId }) => postId === targetPostId);

export const getCommentLikes = (targetCommentId) =>
  db.data.commentLikes.filter(({ commentId }) => commentId === targetCommentId);

export const getMedias = (targetPostId) =>
  db.data.medias.filter(({ postId }) => postId === targetPostId);

/**
 * @param {{memberId: number, contents: string, mediaUrlList: {mediaUrl: string; mediaType: string}[]}} param0
 */
export const createPost = ({ memberId, contents, mediaUrlList }) => {
  // {
  //   "id": 0,
  //   "memberId": 0,
  //   "createdAt": "1698748617993",
  //   "contents": "다욧 중인데 치킨 먹고 싶은 거 참음"
  // },

  const newPostId = db.data.posts.length;

  const newPost = {
    id: newPostId,
    memberId,
    createdAt: Number(new Date()),
    contents,
  };

  db.data.posts.push(newPost);

  if (mediaUrlList.length !== 0) {
    mediaUrlList.map(({ mediaUrl, mediaType }) => {
      const newMediaUrl = {
        id: db.data.medias.length,
        postId: newPostId,
        mediaUrl,
        mediaType,
      };

      db.data.medias.push(newMediaUrl);
    });
  }

  db.write();

  return newPostId;
};

export const createComment = ({ postId, memberId, contents, parentCommentId }) => {
  // {
  //   "id": 5,
  //   "postId": 0,
  //   "memberId": 2,
  //   "parentCommentId": 0,
  //   "replyCount": 0,
  //   "createdAt": "1698748661420",
  //   "contents": "ㅋㅋ남 다르게 칭찬하는 너 칭찬해~"
  // }

  const newCommentId = db.data.comments.length;

  const newComment = {
    id: newCommentId,
    postId,
    memberId,
    parentCommentId,
    replyCount: 0,
    createdAt: Number(new Date()),
    contents,
  };

  db.data.comments.push(newComment);

  db.write();

  return newCommentId;
};

export const countUpReply = (commentId) => {
  const comment = getComment(commentId);

  if (!comment) {
    return;
  }

  const newComment = {
    ...comment,
    replyCount: comment.replyCount + 1,
  };

  db.data.comments = [...db.data.comments.filter(({ id }) => id !== commentId), newComment];
  db.write();
};

export const createPostLike = (postId, memberId, likeType) => {
  const newPostLikeId = db.data.postLikes.length;

  const newPostLike = {
    id: newPostLikeId,
    postId,
    memberId,
    likeType,
  };

  db.data.postLikes.push(newPostLike);
  db.write();

  return newPostLikeId;
};

export const getPostLike = (postLikeId) => db.data.postLikes.find(({ id }) => id === postLikeId);

export const findPostLike = (postId, memberId) =>
  db.data.postLikes.find(({ postId: pid, memberId: mid }) => pid === postId && memberId === mid);

export const deletePostLike = (postLikeId) => {
  db.data.postLikes = [...db.data.postLikes.filter(({ id }) => id !== postLikeId)];
  db.write();
};

export const updatePostLike = (postLikeId, likeType) => {
  const targetPostLike = db.data.postLikes.find(({ id }) => id === postLikeId);

  const newPostLike = {
    ...targetPostLike,
    likeType,
  };

  db.data.postLikes = [...db.data.postLikes.filter(({ id }) => id !== postLikeId), newPostLike];
  db.write();
};

export const createCommentLike = (commentId, memberId, likeType) => {
  const newCommentLikeId = db.data.commentLikes.length;

  const newCommentLike = {
    id: newCommentLikeId,
    commentId,
    memberId,
    likeType,
  };

  db.data.commentLikes.push(newCommentLike);
  db.write();

  return newCommentLikeId;
};

export const deleteCommentLike = (commentLikeId) => {
  db.data.commentLikes = [...db.data.commentLikes.filter(({ id }) => id !== commentLikeId)];
  db.write();
};

export const getCommentLike = (commentId, memberId) =>
  db.data.commentLikes.find(
    ({ commentId: cId, memberId: mId }) => cId === commentId && mId === memberId
  );

export const getWriteCount = (userId) =>
  db.data.posts.filter(({ memberId }) => memberId === userId).length;

export const getReceiveCount = (userId) => {
  // 받은 칭찬: 내가 쓴 게시글의 좋아요 + 내가 쓴 댓글의 좋아요
  const myPostIds = db.data.posts.filter(({ memberId }) => memberId === userId).map(({ id }) => id);

  const allPostLikeCount = myPostIds.reduce((acc, id) => {
    const postLikeCount = db.data.postLikes.filter(({ postId }) => postId === id).length;
    return acc + postLikeCount;
  }, 0);

  const myCommentIds = db.data.comments
    .filter(({ memberId }) => memberId === userId)
    .map(({ id }) => id);

  const allCommentLikeCount = myCommentIds.reduce((acc, id) => {
    const commentLikeCount = db.data.commentLikes.filter(
      ({ commentId }) => commentId === id
    ).length;
    return acc + commentLikeCount;
  }, 0);

  return allPostLikeCount + allCommentLikeCount;
};

export const getMyCompliments = (userId) => {
  const myComplimentsRaw = db.data.posts.filter(({ memberId }) => memberId === userId);
  const myCompliments = myComplimentsRaw.map((compliment) => {
    const commentCount = db.data.comments.filter(({ postId }) => postId === compliment.id).length;
    const likeCount = db.data.postLikes.filter(({ postId }) => postId === compliment.id).length;

    const newCompliment = { ...compliment, commentCount, likeCount };

    delete newCompliment.memberId;

    return newCompliment;
  });

  return myCompliments;
};

export const getMyComments = (userId) => {
  const myCommentsRaw = db.data.comments.filter(({ memberId }) => memberId === userId);
  console.log({ myCommentsRaw });
  const myComments = myCommentsRaw.map((comment) => {
    const likeCount = db.data.commentLikes.filter(
      ({ commentId }) => commentId === comment.id
    ).length;

    const newComment = { ...comment, likeCount };

    delete newComment.postId;
    delete newComment.memberId;
    delete newComment.parentCommentId;

    return newComment;
  });

  return myComments;
};
