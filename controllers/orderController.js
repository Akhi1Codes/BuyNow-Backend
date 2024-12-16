const Order = require("../models/order");
const Product = require("../models/product");
const ErrorHandler = require("../utils/errorhandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

// Stripe Checkout => /api/v1/checkout
exports.checkOut = catchAsyncErrors(async (req, res, next) => {
  const line_items = req.body.line_items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.product_name,
      },
      unit_amount: item.price * 100,
    },
    quantity: item.quantity,
  }));

  const taxAmount = req.body.tax.amount;
  const shippingAmount = req.body.shipping.shippingAmount;

  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        ...line_items,
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Tax",
            },
            unit_amount: taxAmount * 100,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url:
        process.env.NODE_ENV === "PRODUCTION"
          ? "https://buynow-66f3.onrender.com/success"
          : "http://localhost:5173/success",
      cancel_url:
        process.env.NODE_ENV === "PRODUCTION"
          ? "https://buynow-66f3.onrender.com"
          : "http://localhost:5173",

      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: shippingAmount * 100,
              currency: "usd",
            },
            display_name: "Standard Shipping",
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 5,
              },
              maximum: {
                unit: "business_day",
                value: 7,
              },
            },
          },
        },
      ],
    });
    res.status(201).json({
      success: true,
      sessionId: session.id,
      paymentUrl: session.url,
    });
  } catch (error) {
    console.error("Stripe Error:", error);
    next(error);
  }
});

//Create new order => /api/v1/order/new
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
  } = req.body;
  const order = await Order.create({
    shippingInfo,
    orderItems,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paidAt: Date.now(),
    user: req.user._id,
  });
  res.status(201).json({
    success: true,
    order,
  });
});

//Get single order => /api/v1/order/:id

exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }
  res.status(200).json({
    success: true,
    order,
  });
});

//Get loggedin user orders   => /api/v1/orders/me

exports.myOrder = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({
    user: req.user.id,
  });
  res.status(200).json({
    success: true,
    noOfOrders: orders.length,
    orders,
  });
});

//Get all orders   => /api/v1/admin/orders/

exports.allOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();
  let totalAmount = 0;
  orders.forEach((order) => {
    totalAmount += order.totalPrice;
  });
  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});

//Update / Process order - ADMIN  => /api/v1/admin/order/:id

exports.updateOrders = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (order.orderStatus === "Delivered") {
    return next(new ErrorHandler("Order already delivered", 400));
  }
  order.orderItems.forEach(async (item) => {
    await updateStock(item.product, item.quantity);
  });

  (order.orderStatus = req.body.status),
    (order.deliveredAt = Date.now()),
    await order.save();
  res.status(200).json({
    success: true,
    order,
  });
});

async function updateStock(id, quantity) {
  const product = await Product.findById(id);
  product.stock = product.stock - quantity;
  await product.save({
    validateBeforeSave: false,
  });
}

//delete order => /api/v1/admin/order/:id

exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }
  await Order.deleteOne();

  res.status(200).json({
    success: true,
  });
});
