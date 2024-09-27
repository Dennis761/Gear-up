import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    region: {
        type: String,
        required: true,
        enum: ['Kyiv Region', 'Lviv Region', 'Odessa Region', 'Kharkiv Region', 'Dnipro Region'], // регионы как перечисление
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrl: {
        type: String,
        required: true,
    },
}, {
    timestamps: true,
});

export default mongoose.model('Equipment', equipmentSchema);