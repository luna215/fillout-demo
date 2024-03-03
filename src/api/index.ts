import express from 'express';

import MessageResponse from '../interfaces/MessageResponse';
import fillOut from './fillOut';

const router = express.Router();

router.get<{}, MessageResponse>('/', (req, res) => {
  res.json({
    message: 'API - 👋🌎🌍🌏',
  });
});

router.use('/fillOut', fillOut);

export default router;
