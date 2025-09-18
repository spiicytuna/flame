function asyncWrapper(foo) {
  return function (req, res, next) {
     Promise.resolve().then(() => foo(req, res, next)).catch(next);
  };
}

module.exports = asyncWrapper;
