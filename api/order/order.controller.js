import { logger } from '../../services/logger.service.js'
import { socketService } from '../../services/socket.service.js'
import { userService } from '../user/user.service.js'
import { authService } from '../auth/auth.service.js'
import { orderService } from './order.service.js'

export async function getOrders(req, res) {
    try {
        const filterby = {}
        if(req.query.buyerId) filterby.buyerId  = req.query.buyerId
        console.log("🚀 ~ file: order.controller.js:11 ~ getOrders ~ filterby:", filterby)
        const orders = await orderService.query(filterby)
        res.send(orders)
    } catch (err) {
        logger.error('Cannot get orders', err)
        res.status(400).send({ err: 'Failed to get orders' })
    }
}

export async function deleteOrder(req, res) {
    try {
        const deletedCount = await orderService.remove(req.params.id)
        if (deletedCount === 1) {
            res.send({ msg: 'Deleted successfully' })
        } else {
            res.status(400).send({ err: 'Cannot remove order' })
        }
    } catch (err) {
        logger.error('Failed to delete order', err)
        res.status(400).send({ err: 'Failed to delete order' })
    }
}


export async function addOrder(req, res) {

    // var {loggedinUser} = req
    var loggedinUser = authService.validateToken(req.cookies.loginToken)

    try {
        var recievedOrder = req.body
        recievedOrder.buyerId = loggedinUser._id
        logger.info('recieved order:', recievedOrder)
        logger.info('loggedinUser is:', loggedinUser)
        // order.buyerId = loggedinUser._id
        const order = await orderService.add(recievedOrder)
        logger.info('order:', order)
        
        // prepare the updated order for sending out
        order.seller = await userService.getById(order.sellerId)
        logger.info('order seller:', order.seller)

        //MAYBE DETELE THIS BECAUSE WE ARE NOT ADDING A SCORE
        loggedinUser = await userService.update(loggedinUser)

        order.buyer = loggedinUser

        // User info is saved also in the login-token, update it
        const loginToken = authService.getLoginToken(loggedinUser)
        res.cookie('loginToken', loginToken)

        delete order.sellerId
        delete order.buyerId

        // socketService.broadcast({ type: 'order-added', data: order, userId: loggedinUser._id })
        socketService.emitToUser({ type: 'order-for-you', data: order, userId: order.seller._id })

        // const fullUser = await userService.getById(loggedinUser._id)
        // socketService.emitTo({type: 'user-updated', data: fullUser, label: fullUser._id})
        // const currGig = await gigService.getById(order.gigId)
        // socketService.emitTo({type: 'user-updated', data: currGig, label: currGig._id})

        res.send(order)

    } catch (err) {
        logger.error('Failed to add order', err)
        res.status(400).send({ err: 'Failed to add order' })
    }
}

export async function updateOrder(req, res) {
    try {
        const  { order } = req.body
        logger.info('req.body', req.body)
        logger.info('order', order)
        const updatedOrder = await orderService.update(req.body)
        
        // socketService.emitToUser({ type: 'your-order-updated', data: order, userId: order.buyerId })
        res.json(updatedOrder)
        socketService.broadcast({ type: 'order-updated', data: updatedOrder, userId: updatedOrder.seller._id })
        logger.info('updatedOrder', updatedOrder)
        // gIo.emit('order-updated', updatedOrder)


    } catch (err) {
        logger.error('Failed to update order', err)
        res.status(400).send({ err: 'Failed to update order' })

    }
}

