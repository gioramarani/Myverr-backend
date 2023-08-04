import {logger} from '../../services/logger.service.js'
import {socketService} from '../../services/socket.service.js'
import {userService} from '../user/user.service.js'
import {authService} from '../auth/auth.service.js'
import {orderService} from './order.service.js'

export async function getOrders(req, res) {
    try {
        const orders = await orderService.query(req.query)
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
    
    var {loggedinUser} = req
 
    try {
        var order = req.body
        order.buyerId = loggedinUser._id
        order = await orderService.add(order)
        
        // prepare the updated order for sending out
        order.seller = await userService.getById(order.sellerId)
        

        loggedinUser = await userService.update(loggedinUser)
        order.buyer = loggedinUser

        // User info is saved also in the login-token, update it
        const loginToken = authService.getLoginToken(loggedinUser)
        res.cookie('loginToken', loginToken)

        delete order.sellerId
        delete order.buyerId

        socketService.broadcast({type: 'order-added', data: order, userId: loggedinUser._id})
        socketService.emitToUser({type: 'order-about-you', data: order, userId: order.seller._id})
        
        const fullUser = await userService.getById(loggedinUser._id)
        socketService.emitTo({type: 'user-updated', data: fullUser, label: fullUser._id})

        res.send(order)

    } catch (err) {
        logger.error('Failed to add order', err)
        res.status(400).send({ err: 'Failed to add order' })
    }
}
