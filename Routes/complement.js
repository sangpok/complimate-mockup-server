import jsonServer from 'json-server';

/** DB */
import { getComplements } from '../DB/index.js';

/** @param {jsonServer.JsonServerRouter} router */
export const getComplementRoute = (router) => {
  router.get('/get', (req, res) => {
    const queryParams = req.query;

    const pageSize = queryParams?.pageSizeQuery || 10;
    const lastViewId = queryParams?.lastViewIdQuery || 0;

    const complements = getComplements(pageSize, lastViewId);

    return res.status(200).send(complements);
  });

  return router;
};
