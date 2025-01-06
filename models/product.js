const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Plese enter the product name"],
        trim: true,
        maxLength: [100, "Product name cannot exceed 100 characters"],
    },
    price: {
        type: Number,
        required: [true, "Plese enter the product price"],
        maxLength: [5, "Product name cannot exceed 100 characters"],
        default: 0.0,
    },
    description: {
        type: String,
        required: [true, "Plese enter the product description"],
    },
    ratings: {
        type: Number,
        default: 0,
    },
    images: [
        {
            public_id: {
                type: String,
                required: true,
            },
            url: {
                type: String,
                required: true,
            },
        },
    ],
    category: {
        type: String,
        required: [true, "please select category for this product"],
        enum: {
            values: [
                "Electronics",
                "Food",
                "Clothing",
                "Kitchen",
                "Beauty",
                "Sports",
                "ToysandGames",
                "Books",
                "Automotive",
                "Fitness",
                "OfficeSupplies"
            ],
            nessage: "Plese select correct category for the products",
        },
    },
    seller: {
        type: String,
        required: [true, "Plesse enter product seller"],
    },
    stock: {
        type: Number,
        required: [true, "Please enter the products details"],
        maxLength: [5, "Product name cannot exceed 5 characters"],
        default: 0,
    },
    numofReviews: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            user: {
                type: mongoose.Schema.ObjectId,
                ref: "User",
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
            rating: {
                type: Number,
                required: true,
            },
            comment: {
                type: String,
                required: true,
            },
        },
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Products", productSchema);
