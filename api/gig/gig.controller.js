import {gigService} from './gig.service.js'
import {logger} from '../../services/logger.service.js'

export async function getGigs(req, res) {
  try {
    logger.debug('Getting Gigs:', req.query)
    const filterBy = {
      // txt: req.query.txt || '',
      // pageIdx: req.query.pageIdx
    }
    const gigs = await gigService.query(filterBy)
    res.json(gigs)
  } catch (err) {
    logger.error('Failed to get gigs', err)
    res.status(400).send({ err: 'Failed to get gigs' })
  }
}

export async function getGigById(req, res) {
  try {
    const gigId = req.params.id
    const gig = await gigService.getById(gigId)
    res.json(gig)
  } catch (err) {
    logger.error('Failed to get gig', err)
    res.status(400).send({ err: 'Failed to get gig' })
  }
}

export async function addGig(req, res) {
  const {loggedinUser} = req

  try {
    const gig = req.body
    gig.owner = loggedinUser
    const addedGig = await gigService.add(gig)
    res.json(addedGig)
  } catch (err) {
    logger.error('Failed to add gig', err)
    res.status(400).send({ err: 'Failed to add gig' })
  }
}


export async function updateGig(req, res) {
  try {
    const gig = req.body
    const updatedGig = await gigService.update(gig)
    res.json(updatedGig)
  } catch (err) {
    logger.error('Failed to update gig', err)
    res.status(400).send({ err: 'Failed to update gig' })

  }
}

export async function removeGig(req, res) {
  try {
    const gigId = req.params.id
    const removedId = await gigService.remove(gigId)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove gig', err)
    res.status(400).send({ err: 'Failed to remove gig' })
  }
}

export async function addGigMsg(req, res) {
  const {loggedinUser} = req
  try {
    const gigId = req.params.id
    const msg = {
      txt: req.body.txt,
      by: loggedinUser
    }
    const savedMsg = await gigService.addGigMsg(gigId, msg)
    res.json(savedMsg)
  } catch (err) {
    logger.error('Failed to update gig', err)
    res.status(400).send({ err: 'Failed to update gig' })

  }
}

export async function removeGigMsg(req, res) {
  const {loggedinUser} = req
  try {
    const gigId = req.params.id
    const {msgId} = req.params

    const removedId = await gigService.removeGigMsg(gigId, msgId)
    res.send(removedId)
  } catch (err) {
    logger.error('Failed to remove gig msg', err)
    res.status(400).send({ err: 'Failed to remove gig msg' })

  }
}


