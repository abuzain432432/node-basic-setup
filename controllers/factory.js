const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ApiFeatures = require('../utils/apiFeatures');
exports.deleteOne = Modal => {
  return catchAsync(async (req, res, next) => {
    const doc = await Modal.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }
    res.status(204).json({
      status: 'success',
      data: null,
    });
  });
};

exports.updateOne = Modal => {
  return catchAsync(async (req, res, next) => {
    const updatedDoc = await Modal.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedDoc) {
      return next(new AppError('No doc found with that ID', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: updatedDoc,
      },
    });
  });
};
exports.createOne = Modal => {
  return catchAsync(async (req, res, next) => {
    const doc = await Modal.create(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
};

exports.getOne = (Modal, popOptions) => {
  return catchAsync(async (req, res, next) => {
    let query = Modal.findById(req.params.id);
    if (popOptions) {
      query.populate(popOptions);
    }
    const doc = await query;
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
};

exports.getAll = Modal => {
  return catchAsync(async (req, res, next) => {
    // To allow for nested GET reviews on tour (hack)
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.id };
    const dbQueryObject = new ApiFeatures(
      Modal.find(filter),
      req.query
    )
      .pagination()
      .filter()
      .sorting()
      .limitFields();

    // const docs = await dbQueryObject.query.explain();
    const docs = await dbQueryObject.query;
    res.status(200).json({
      status: 'success',
      results: docs.length,
      data: {
        data: docs,
      },
    });
  });
};
