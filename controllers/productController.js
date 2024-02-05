const slugify = require('slugify');
const asyncHandler = require('express-async-handler');
const Product = require('../models/productModel');
const ApiError = require('../utils/ApiError');

// @desc    Get all products
// @route   GET /api/products
// @access  Puplic

exports.getAllProducts = asyncHandler(async (req, res) => {
  // Filtering
  const queryStringObj = { ...req.query };
  const excludesFields = ['page', 'sort', 'limit', 'fields'];
  excludesFields.forEach(field => delete queryStringObj[field]);

  let queryStr = JSON.stringify(queryStringObj);
  queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

  // Pagination
  const page = req.query.page * 1 || 1;
  const limit = req.query.limit * 1 || 50;
  const skip = (page - 1) * limit;

  // Build query
  let mongooseQuery = Product.find(JSON.parse(queryStr))
    .skip(skip)
    .limit(limit)
    .populate({ path: 'category', select: 'name' });

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    mongooseQuery = mongooseQuery.sort(sortBy);
  } else {
    mongooseQuery = mongooseQuery.sort('-sold');
  }

  // Execute query
  const products = await mongooseQuery;

  res.status(200).json({
    status: 'success',
    length: products.length,
    page,
    data: { products },
  });
});

// @desc    Get Specific product
// @route   GET /api/products/:id
// @access  Puplic

exports.getProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findById(id).populate({
    path: 'category',
    select: 'name',
  });

  if (!product) return next(new ApiError(`No product for this ID ${id}`, 404));
  res.status(200).json({ status: 'success', data: { product } });
});

// @desc    Create product
// @route   POST /api/products
// @access  Private

exports.createProduct = asyncHandler(async (req, res) => {
  req.body.slug = slugify(req.body.title);

  const newProduct = await Product.create(req.body);
  res.status(201).json({
    status: 'success',
    data: { newProduct },
  });
});

// @desc    Update product
// @route   PATCH /api/products/:id
// @access  Private

exports.updateProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (req.body.title) {
    req.body.slug = slugify(req.body.title);
  }
  const product = await Product.findByIdAndUpdate(id, req.body, {
    new: true,
  });

  if (!product) return next(new ApiError(`No product for this ID ${id}`, 404));

  res.status(200).json({ status: 'success', data: { product } });
});

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private

exports.deleteProduct = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const product = await Product.findByIdAndDelete(id);

  if (!product) return next(new ApiError(`No product for this ID ${id}`, 404));

  res.status(204).json({ status: 'success' });
});