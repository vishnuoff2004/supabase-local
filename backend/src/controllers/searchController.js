const { Agency } = require('../models');
const searchService = require('../services/searchService');

async function search(req, res, next) {
  try {
    const { source, destination } = req.query;
    const result = await searchService.searchRoutes(source, destination);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function listAgencies(req, res, next) {
  try {
    const agencies = await Agency.findAll({ where: { active: true }, attributes: ['id', 'name', 'email'] });
    res.json(agencies);
  } catch (err) {
    next(err);
  }
}

module.exports = { search, listAgencies };
