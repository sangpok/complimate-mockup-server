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

export const getComplements = (pageSize = 10, lastViewId = 0) => {
  const startViewIndex = db.data.posts.findIndex(({ id }) => id === lastViewId);

  const complementsRaw = db.data.posts.slice(startViewIndex, startViewIndex + pageSize);
  const mutatedComplements = complementsRaw.map((complement) => {
    const postLikes = getPostLikes(complement.id);
    const writer = { ...getUser(complement.memberId) };

    delete writer.id;
    delete writer.email;
    delete writer.password;

    const commentsRaw = getComments(complement.id);
    const comments = commentsRaw.map((comment) => {
      const commentLikes = getCommentLikes(comment.id);
      const commentWriter = { ...getUser(comment.memberId) };

      delete commentWriter.id;
      delete commentWriter.email;
      delete commentWriter.password;

      delete comment.memberId;
      delete comment.postId;

      return {
        ...comment,
        likeCount: commentLikes.length,
        writer: { ...commentWriter },
      };
    });

    const bestCommentList = [...comments].sort((a, b) => b.likeCount - a.likeCount).slice(0, 3);

    let newComplement = { ...complement };

    newComplement = {
      ...newComplement,
      totalLikeCount: postLikes.length,
      likeList: ['LIKE', 'PRAY', 'LAUGH_WITH_SAD', 'HEART_EYES', 'ANGEL_SMILE'].map((likeType) => ({
        likeType,
        likeCount: postLikes.filter(({ likeType: lt }) => lt === likeType).length,
      })),

      writer,
      bestCommentList,
    };

    delete newComplement.memberId;

    return newComplement;
  });

  return mutatedComplements;
};

export const getComment = (commentId) => db.data.comments.find(({ id }) => id === commentId);

export const getComments = (targetPostId) =>
  db.data.comments.filter(({ postId }) => postId === targetPostId);

export const getPostLikes = (targetPostId) =>
  db.data.postLikes.filter(({ postId }) => postId === targetPostId);

export const getCommentLikes = (targetCommentId) =>
  db.data.commentLikes.filter(({ commentId }) => commentId === targetCommentId);
