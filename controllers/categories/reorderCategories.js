const asyncWrapper = require('../../middleware/asyncWrapper');
const Category = require('../../models/Category');

// @desc      Reorder categories
// @route     PUT /api/categories/0/reorder
// @access    Public
const reorderCategories = asyncWrapper(async (req, res, next) => {
  const updates = req.body.categories.map(({ id, orderId }) =>
    Category.update({ orderId }, { where: { id } })
  );

  await Promise.all(updates);

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = reorderCategories;
