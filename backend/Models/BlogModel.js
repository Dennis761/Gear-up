import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    date: {
        type: Date,
        required: true,
    },
    author: {
        type: String,
        required: true,
        trim: true,
    },
    content: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    likesCount: {
        type: Number,
        default: 0, // Начальное значение лайков
    },
}, {
    timestamps: true,
});

export default mongoose.model('Blog', blogSchema);