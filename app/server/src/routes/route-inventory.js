const { getServerRouteInventory } = require('../lib/route-inventory');

function registerRouteInventoryRoutes(app, { requireAuth, projectRoot, serverFile }) {
  app.get('/api/v1/server-route-inventory', requireAuth, (req, res) => {
    try {
      res.json({
        inventory: getServerRouteInventory({
          projectRoot,
          serverFile
        })
      });
    } catch (error) {
      res.status(500).json({
        inventory: {
          status: 'failed',
          error: error.message
        }
      });
    }
  });
}

module.exports = {
  registerRouteInventoryRoutes
};
