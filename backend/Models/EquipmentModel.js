import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
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
    rating: {
        allStars: {
            type: Number,
            default: 0
        },
        ratersList: [{
            raterId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            stars: {
                type: Number,
                required: true
            }
        }],
        averageStars: {
            type: Number,
            default: 0
        }
    },
    sportCategory: {
        type: [String],
        enum: ['Soccer', 'Basketball', 'Tennis', 'Swimming', 'Running', 'Cycling', 'Volleyball', 'Baseball', 'Rugby', 'Golf', 'Snowboarding', 'Skiing', 'Rock Climbing', 'Kayaking', 'Boxing', 'Wrestling', 'Archery', 'Surfing', 'Skateboarding', 'Badminton'],
        required: true,
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