const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const id = req.params.id * 1;
    // const tour = tours.find((el) => el.id === id);
    const document = await Model.findByIdAndDelete(req.params.id);

    if (!document) {
      return next(new AppError('No Document found with that ID', 404));
    }

    res.status(204).json({
      staus: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // const id = req.params.id * 1;
    // const tour = tours.find((el) => el.id === id);

    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      staus: 'success',
      data: {
        data: document, //<> signify a placeholder!!
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const document = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.getOne = (Model, populateOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (populateOptions) query = query.populate(populateOptions);

    const document = await query;
    // Model.findOne({_id: req.params.id})
    // console.log('Checking Model: ', document);
    if (!document) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: document,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    // To allow nested get reviews on a tour, doing it as a hack to avoid long solution
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query);
    features.filter().sort().limitiFields().paginate();
    const doc = await features.query;
    // console.log('checking all users!!!');

    // SEND RESPONSE
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: doc.length,
      data: {
        data: doc, // In es6 we don't need to specify key and values if they have the same name
      },
    });
  });
