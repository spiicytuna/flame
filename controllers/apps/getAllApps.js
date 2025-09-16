const asyncWrapper = require('../../middleware/asyncWrapper');
const App = require('../../models/App');
const Category = require('../../models/Category');
const { Sequelize } = require('sequelize');
const loadConfig = require('../../utils/loadConfig');

const { useKubernetes, useDocker } = require('./docker');

// @desc      Get all apps
// @route     GET /api/apps
// @access    Public
const getAllApps = asyncWrapper(async (req, res, next) => {
  const {
    useOrdering: orderType,
    dockerApps: useDockerAPI,
    kubernetesApps: useKubernetesAPI,
  } = await loadConfig();

  let apps;

  if (useDockerAPI) {
    await useDocker(apps);
  }

  if (useKubernetesAPI) {
    await useKubernetes(apps);
  }

  const order =
    orderType == 'name'
      ? [[Sequelize.fn('lower', Sequelize.col('name')), 'ASC']]
      : [[orderType, 'ASC']];

  // total apps ??
  const totalApps = await App.count();
  let visibleApps;

  // show ??
  if (req.isAuthenticated) {
    visibleApps = await App.findAll({
      order,
    });
  } else {
    // public users
    visibleApps = await App.findAll({
      order,
      where: { isPublic: true },
      include: [{
        model: Category,
        as: 'category',
        where: { isPublic: true },
        required: true
      }]
    });
  }

  // response => num apps
  const responseData = {
    apps: visibleApps,
    totalApps: totalApps,
  };

  if (process.env.NODE_ENV === 'production') {
    return res.status(200).setHeader('Cache-Control', 'no-store').json({
      success: true,
      data: responseData,
    });
  }

  res.status(200).json({
    success: true,
    data: responseData,
  });
});

module.exports = getAllApps;
