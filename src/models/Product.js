const { default: mongoose, Schema } = require("mongoose");

const productSchema = mongoose.Schema(
    {
        writer: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        title: {
            type: String,
            maxLength: 60,
        },

        description: {
            type: String,
        },

        price: {
            type: Number,
            default: 0,
        },

        images: {
            type: Array,
            default: [],
        },

        sold: {
            type: Number,
            default: 0,
        },

        category: {
            type: Number,
            default: 1,
        },

        views: {
            type: Number,
            default: 0,
        },
        averageRating: {
            type: Number,
            default: 0,
        },
        reviewCount: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);
productSchema.index(
    {
        title: "text",
        description: "text",
    },
    {
        weight: {
            title: 5,
            description: 1,
        },
    }
);
const Product = mongoose.model("Product", productSchema);

module.exports = Product;
