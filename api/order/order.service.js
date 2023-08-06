import {dbService} from '../../services/db.service.js'
import {logger} from '../../services/logger.service.js'
import {asyncLocalStorage} from '../../services/als.service.js'
import mongodb from 'mongodb'
import { json } from 'express'
const {ObjectId} = mongodb

// adapt the key name to buyer and seller.
async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection('order')
        const orders2 = await collection.find(criteria).toArray()
        var orders = await collection.aggregate([
            {
                $match: criteria
            },
            {
                $addFields: {
                  buyerObjId: { $toObjectId: '$buyerId' },
                  sellerObjId: { $toObjectId: '$sellerId' },
                     gigObjId: { $toObjectId: '$gigId' },
                },
              },
            {
                $lookup:
                {
                    localField: 'buyerObjId',
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
                    localField: 'sellerObjId',
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
                    localField: 'gigObjId',
                    from: 'gig',
                    foreignField: '_id',
                    as: 'gig'
                }
            },
            {
                $unwind: '$gig'
            },
            {
                $project: {
                  createdAt: 1,
                  status: 1,
                  buyer: { _id: 1, username: 1 },
                  seller: { _id: 1, username: 1 },
                  gig: { _id: 1, title: 1, price: 1},
                },
              },
        ]).toArray()
        // orders = orders.map(order => {
        //     order.buyer = { _id: order.buyer._id, fullname: order.buyer.fullname }
        //     order.seller = { _id: order.seller._id, fullname: order.seller.fullname }
        //     order.gig = { _id: order.gig._id, title: order.gig.title, price: order.gig.price }
        //     delete order.buyerId
        //     delete order.sellerId
        //     delete order.gigId
        //     return order
        // })

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
        const orderToSave =
        // JSON.parse(JSON.stringify(order))
        {
                buyer: order.buyer,
                seller: order.seller,
                gig: order.gig,
                status: order.status,
            }
            logger.info('orderToSave:' ,orderToSave)
        const collection = await dbService.getCollection('order')
        await collection.updateOne({ _id: new ObjectId(order._id) }, { $set: orderToSave })
        return order
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


