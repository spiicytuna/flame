const asyncWrapper = require('../../middleware/asyncWrapper');
const Category = require('../../models/Category');
const Bookmark = require('../../models/Bookmark');
const { Sequelize } = require('sequelize');
const loadConfig = require('../../utils/loadConfig');

// @desc      Get all categories
// @route     GET /api/categories
// @access    Public
const getAllCategories = asyncWrapper(async (req, res, next) => {
  const { useOrdering: orderType } = await loadConfig();

  let categories;
  let output;

  // cat vis
  const section = req.query.section || 'bookmarks';
  const where = req.isAuthenticated ? { section } : { section, isPublic: true };
  
  // how many ??
  const totalCategories = await Category.count({ where: { section } });

  const order =
    orderType == 'name'
      ? [
          [Sequelize.fn('lower', Sequelize.col('Category.name')), 'ASC'],
          [Sequelize.fn('lower', Sequelize.col('bookmarks.name')), 'ASC'],
        ]
      : [
          [orderType, 'ASC'],
          [{ model: Bookmark, as: 'bookmarks' }, orderType, 'ASC'],
        ];

  categories = await Category.findAll({
    include: [
      {
        model: Bookmark,
        as: 'bookmarks',
        // public user
        required: false,
        where: req.isAuthenticated ? undefined : { isPublic: true }
      },
    ],
    order,
    where,
  });

  if (req.isAuthenticated) {
    output = categories;
  } else {
    // filter priv books
    output = categories.map((c) => c.get({ plain: true }));
    output = output.map((c) => ({
      ...c,
      bookmarks: c.bookmarks.filter((b) => b.isPublic),
    }));
  }

  // num books
  const responseData = {
    categories: output,
    total: totalCategories
  }

  res.status(200).json({
    success: true,
    data: responseData,
  });
});

module.exports = getAllCategories;
