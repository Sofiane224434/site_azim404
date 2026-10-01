import { Router } from 'express';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../controllers/accounts.controller.js';

const router = Router();

router.get('/', getAccounts);
router.post('/', createAccount);
router.put('/update', updateAccount);
router.delete('/:id', deleteAccount);

export default router;
