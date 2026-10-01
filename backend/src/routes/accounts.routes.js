import { Router } from 'express';
import { getAccounts, createAccount, deleteAccount } from '../controllers/accounts.controller.js';

const router = Router();

router.get('/', getAccounts);
router.post('/', createAccount);
router.delete('/:id', deleteAccount);

export default router;
