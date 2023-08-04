import express from 'express'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'
import { log } from '../../middlewares/logger.middleware.js'

import {addOrder, getOrders, deleteOrder} from './order.controller.js'
const router = express.Router()

router.get('/', log, getOrders)
router.post('/',  log, requireAuth, addOrder)
router.delete('/:id',  requireAuth, deleteOrder)

export const orderRoutes = router