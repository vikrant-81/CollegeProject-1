const express = require('express');
const Lead = require('../models/Lead');
const authenticate = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function getInMemoryLeads(req) {
  return req.app.locals.leadsStore;
}

function createInMemoryLead(req, payload) {
  const lead = {
    _id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...payload,
    createdAt: new Date(),
    notes: payload.notes || [],
  };
  req.app.locals.leadsStore.unshift(lead);
  return lead;
}

function updateInMemoryLead(req, id, payload) {
  const leads = getInMemoryLeads(req);
  const index = leads.findIndex((lead) => lead._id === id);
  if (index === -1) return null;
  leads[index] = { ...leads[index], ...payload };
  return leads[index];
}

function deleteInMemoryLead(req, id) {
  const leads = getInMemoryLeads(req);
  const index = leads.findIndex((lead) => lead._id === id);
  if (index === -1) return null;
  return leads.splice(index, 1)[0];
}

router.get('/', async (req, res) => {
  if (!req.app.locals.dbConnected) {
    return res.json(getInMemoryLeads(req));
  }

  try {
    const leads = await Lead.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    res.status(500).json({ message: 'Unable to fetch leads.' });
  }
});

router.post('/', async (req, res) => {
  const { name, email, source, status, company, notes } = req.body;
  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required.' });
  }

  const payload = { name, email, source, status, company, notes: notes || [] };
  if (!req.app.locals.dbConnected) {
    const newLead = createInMemoryLead(req, payload);
    return res.status(201).json(newLead);
  }

  try {
    const newLead = new Lead(payload);
    await newLead.save();
    res.status(201).json(newLead);
  } catch (error) {
    console.error('Failed to create lead:', error);
    res.status(500).json({ message: 'Unable to create lead.' });
  }
});

router.put('/:id', async (req, res) => {
  if (!req.app.locals.dbConnected) {
    const updated = updateInMemoryLead(req, req.params.id, req.body);
    if (!updated) return res.status(404).json({ message: 'Lead not found.' });
    return res.json(updated);
  }

  try {
    const updated = await Lead.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      return res.status(404).json({ message: 'Lead not found.' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Failed to update lead:', error);
    res.status(500).json({ message: 'Unable to update lead.' });
  }
});

router.delete('/:id', async (req, res) => {
  if (!req.app.locals.dbConnected) {
    const deleted = deleteInMemoryLead(req, req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Lead not found.' });
    }
    return res.json({ message: 'Lead deleted.' });
  }

  try {
    const deleted = await Lead.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Lead not found.' });
    }
    res.json({ message: 'Lead deleted.' });
  } catch (error) {
    console.error('Failed to delete lead:', error);
    res.status(500).json({ message: 'Unable to delete lead.' });
  }
});

module.exports = router;
