import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { utilService } from '../../services/util.service.js'
import mongodb from 'mongodb'
const { ObjectId } = mongodb

const PAGE_SIZE = 3

async function query(filterBy = {}) {
	const collection = await dbService.getCollection('giora')
	try {
		const criteria = buildCriteria(filterBy).criteria
		console.log('filterBy', filterBy)
		console.log('sortBy:', filterBy.sortBy)

		let gigs = await collection.find(criteria).toArray()

		console.log(filterBy.sortBy)
		// Sort in memory
		if (filterBy.sortBy === 'Highest Rating') {
			gigs = gigs.sort((a, b) => {
				const avgRatingA =
					a.reviews.reduce((acc, review) => acc + review.rate, 0) /
					a.reviews.length
				const avgRatingB =
					b.reviews.reduce((acc, review) => acc + review.rate, 0) /
					b.reviews.length
				return avgRatingB - avgRatingA
			})
		} else if (filterBy.sortBy === 'Most Reviews') {
			gigs = gigs.sort((a, b) => b.reviews.length - a.reviews.length)
		}

		return gigs
	} catch (err) {
		logger.error('cannot find gigs', err)
		throw err
	}
}

async function getById(gigId) {
	try {
		const collection = await dbService.getCollection('giora')
		const gig = collection.findOne({ _id: ObjectId(gigId) })
		return gig
	} catch (err) {
		logger.error(`while finding gig ${gigId}`, err)
		throw err
	}
}

async function remove(gigId) {
	try {
		const collection = await dbService.getCollection('giora')
		await collection.deleteOne({ _id: ObjectId(gigId) })
		return gigId
	} catch (err) {
		logger.error(`cannot remove gig ${gigId}`, err)
		throw err
	}
}

async function add(gig) {
	try {
		const collection = await dbService.getCollection('giora')
		await collection.insertOne(gig)
		return gig
	} catch (err) {
		logger.error('cannot insert gig', err)
		throw err
	}
}

async function update(gig) {
	try {
		const gigToSave = {
			title: gig.title,
			description: gig.description,
		}
		const collection = await dbService.getCollection('giora')
		await collection.updateOne(
			{ _id: ObjectId(gig._id) },
			{ $set: gigToSave }
		)
		return gig
	} catch (err) {
		logger.error(`cannot update gig ${gigId}`, err)
		throw err
	}
}

async function addGigMsg(gigId, msg) {
	try {
		msg.id = utilService.makeId()
		const collection = await dbService.getCollection('gig')
		await collection.updateOne(
			{ _id: ObjectId(gigId) },
			{ $push: { msgs: msg } }
		)
		return msg
	} catch (err) {
		logger.error(`cannot add gig msg ${gigId}`, err)
		throw err
	}
}

async function removeGigMsg(gigId, msgId) {
	try {
		const collection = await dbService.getCollection('gig')
		await collection.updateOne(
			{ _id: ObjectId(gigId) },
			{ $pull: { msgs: { id: msgId } } }
		)
		return msgId
	} catch (err) {
		logger.error(`cannot add gig msg ${gigId}`, err)
		throw err
	}
}

function buildCriteria(filterBy) {
	const criteria = {}
	const sort = {}

	// if (filterBy.title) {
	//     criteria.title = { $regex: filterBy.title, $options: 'i' }
	// }
	// if (filterBy.category) {
	//     criteria.category = filterBy.category
	// }
	// if (filterBy.subCategory) {
	//     criteria.subCategory = filterBy.subCategory
	// }
	// if (filterBy.owner) {
	//     criteria.owner = filterBy.owner
	// }

	if (filterBy.min && filterBy.max) {
		const min = parseInt(filterBy.min)
		const max = parseInt(filterBy.max)
		criteria.price = { $gte: min, $lte: max }
	}

	// Delivery days filter
	if (filterBy.delivery) {
		const delivery = parseInt(filterBy.delivery)

		criteria.daysToMake = { $lte: delivery }
	}

	// Tags (subCategory) filter
	if (filterBy.subCategory) {
		criteria.tags = { $in: [filterBy.subCategory.toLowerCase()] }
	}

	// Text search filter
	if (filterBy.txt) {
		console.log(
			'🚀 ~ file: gig.service.js:188 ~ buildCriteria ~ filterBy.txt:',
			filterBy.txt
		)
		const regex = new RegExp(filterBy.txt, 'i')
		criteria.$or = [{ title: regex }, { 'owner.fullname': regex }]
	}
	console.log('criteria', criteria)
	if (filterBy.sortBy === 'Highest Rating') {
		// NOTE: MongoDB doesn't support sorting by derived/calculated values directly.
		// This assumes you have a 'rating' field on each gig that stores the average rating.
		sort.rating = -1
	}

	return {
		criteria,
		sort,
	}
}
export const gigService = {
	remove,
	query,
	getById,
	add,
	update,
	addGigMsg,
	removeGigMsg,
}
