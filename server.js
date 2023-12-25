/** JSON Server */
import jsonServer from 'json-server';

/** Cookie Parser */
import cookieParser from 'cookie-parser';

/** Cors Middleware */
import cors from 'cors';

/** Route Import */
import { getMembersRoute } from './Routes/member.js';
import { getAuthRoute } from './Routes/auth.js';
import { getComplementRoute } from './Routes/complement.js';
import { getMypageRoute } from './Routes/mypage.js';

/** 서버 생성 및 Middleware 적용 */
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();

server.use(
  cors({
    // origin: '*',
    // origin: ['http://localhost:5173', 'http://172.30.1.12:5173'],
    origin: ['http://ec2-3-35-26-247.ap-northeast-2.compute.amazonaws.com:5173/'],
    credentials: true,
  })
);
server.use(jsonServer.bodyParser);
server.use(cookieParser());
server.use(middlewares);

/** Route 설정 */
server.use('/mypage', getMypageRoute(server._router));
server.use('/auth', getAuthRoute(server._router));
server.use('/member', getMembersRoute(server._router));
server.use('/complement', getComplementRoute(server._router));
server.use(router);

/** 서버 열기 */
server.listen(3001, () => {
  console.log('JSON Server is running');
});
