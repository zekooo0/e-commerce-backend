const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const ApiFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model, modelName = '') =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    if (modelName === 'User') {
      const document = await Model.findByIdAndUpdate(id, { active: false });
      if (!document) {
        return next(new ApiError(`No document for this id ${id}`, 404));
      }
    } else {
      const document = await Model.findByIdAndDelete(id);
      if (!document) {
        return next(new ApiError(`No document for this id ${id}`, 404));
      }
    }
    res.status(204).json({ status: 'success' });
  });

exports.updateOne = Model =>
  asyncHandler(async (req, res, next) => {
    const document = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!document) {
      return next(
        new ApiError(`No document for this id ${req.params.id}`, 404),
      );
    }
    res.status(200).json({ status: 'success', data: document });
  });

exports.createOne = Model =>
  asyncHandler(async (req, res) => {
    const newDoc = await Model.create(req.body);
    res.status(201).json({ status: 'success', data: newDoc });
  });

exports.getOne = Model =>
  asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const document = await Model.findById(id);

    if (!document) {
      return next(new ApiError(`No document for this id ${id}`, 404));
    }
    res.status(200).json({ status: 'success', data: document });
  });

exports.getAll = (Model, modelName = '') =>
  asyncHandler(async (req, res) => {
    let filter = {};
    if (req.filterObj) {
      filter = req.filterObj;
    }
    const apiFeatures = new ApiFeatures(Model.find(filter), req.query)
      .paginate()
      .filter()
      .search(modelName)
      .limitFields()
      .sort();

    const { mongooseQuery, paginationResult } = apiFeatures;
    const documents = await mongooseQuery;

    res
      .status(200)
      .json({ results: documents.length, paginationResult, data: documents });
  });
