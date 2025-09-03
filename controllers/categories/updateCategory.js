const Category = require('../../models/Category');
const Logger = require('../../utils/Logger');
const logger = new Logger();

module.exports = async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const {
      name,
      isPublic,
      isPinned,
      section,
      abbreviation,
      orderId,
    } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name != null) category.name = String(name).trim();
    if (isPublic != null) category.isPublic = !!isPublic;
    if (isPinned != null) category.isPinned = !!isPinned;
    if (section === 'apps' || section === 'bookmarks') category.section = section;
    if (abbreviation != null) category.abbreviation = String(abbreviation || '—').slice(0, 3) || '—';
    if (orderId != null) category.orderId = Number(orderId);

    await category.save();
    return res.json({ success: true, data: category });
  } catch (err) {
    if (err && err.name === 'SequelizeUniqueConstraintError') {
      return res
        .status(409)
        .json({ success: false, message: 'Category name already exists in this section' });
    }
    logger.error(err);
    return res.status(500).json({ success: false, message: 'Failed to update category' });
  }
};
