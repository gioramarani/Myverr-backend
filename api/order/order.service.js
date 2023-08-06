import {dbService} from '../../services/db.service.js'
import {logger} from '../../services/logger.service.js'
import {asyncLocalStorage} from '../../services/als.service.js'
import mongodb from 'mongodb'
const {ObjectId} = mongodb

// adapt the key name to buyer and seller.
async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection('order')
        // const orders = await collection.find(criteria).toArray()
        var orders = await collection.aggregate([
            {
                $match: criteria
            },
            {
                $lookup:
                {
                    localField: 'buyerId',
                    from: 'user',
                    foreignField: '_id',
                    as: 'buyer'
                }
            },
            {
                $unwind: '$buyer'
            },
            {
                $lookup:
                {
                    localField: 'sellerId',
                    from: 'user',
                    foreignField: '_id',
                    as: 'seller'
                }
            },
            {
                $unwind: '$seller'
            },
            {
                $lookup:
                {
                    localField: 'gigId',
                    from: 'gig',
                    foreignField: '_id',
                    as: 'gig'
                }
            },
            {
                $unwind: '$gig'
            }
        ]).toArray()
        orders = orders.map(order => {
            order.buyer = { _id: order.buyer._id, fullname: order.buyer.fullname }
            order.seller = { _id: order.seller._id, fullname: order.seller.fullname }
            order.gig = { _id: order.gig._id, title: order.gig.title, price: order.gig.price }
            delete order.buyerId
            delete order.sellerId
            delete order.gigId
            return order
        })

        return orders
    } catch (err) {
        logger.error('cannot find orders', err)
        throw err
    }

}

async function remove(orderId) {
    try {
        const store = asyncLocalStorage.getStore()
        const { loggedinUser } = store
        const collection = await dbService.getCollection('order')
        // remove only if user is owner/admin
        const criteria = { _id: ObjectId(orderId) }
        if (!loggedinUser.isAdmin) criteria.buyerId = ObjectId(loggedinUser._id)
        const {deletedCount} = await collection.deleteOne(criteria)
        return deletedCount
    } catch (err) {
        logger.error(`cannot remove order ${orderId}`, err)
        throw err
    }
}


async function add(recievedOrder) {
    try {
        // const orderToAdd = {
        //     sellerId: ObjectId(recievedOrder.sellerId),
        //     gigId: ObjectId(recievedOrder.gigId),
        //     // buyerId: ObjectId(recievedOrder.buyerId),
        //     status: recievedOrder.status,
        //     createdAt: recievedOrder.createdAt,
        //     packageType: recievedOrder.packageType
        // }
        logger.info('order added', recievedOrder)
        const collection = await dbService.getCollection('order')
        await collection.insertOne(recievedOrder)
        return recievedOrder
    } catch (err) {
        logger.error('cannot insert order', err)
        throw err
    }
}

async function update(order) {
    logger.info('order:' ,order)
    try {
        const orderToSave = order
        // {
        //     buyerId: order.buyerId,
        //     sellerId: order.sellerId,
        //     gigId: order.gigId,
        //     status: order.status,
        //     createdAt: order.createdAt,
        //     packageType: order.packageType,
        // }
        const collection = await dbService.getCollection('order')
        await collection.updateOne({ sellerId: order.sellerId }, { $set: orderToSave })
        return orderToSave
    } catch (err) {
        logger.error(`cannot update order ${order._id}`, err)
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}
    if (filterBy.buyerId) criteria.buyerId = filterBy.buyerId
    return criteria
}

export const orderService = {
    query,
    remove,
    add,
    update,
}


