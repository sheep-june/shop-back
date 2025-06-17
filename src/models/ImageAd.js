const mongoose = require("mongoose");
const { Schema } = mongoose;

const imageAdSchema = new Schema(
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        image: {
            type: String,
            required: true,
        },
        order: {
            type: Number,
            default: 1,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ImageAd", imageAdSchema);
