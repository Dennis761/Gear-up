import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
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
    email: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v); // проверка на валидный email
            },
            message: props => `${props.value} is not a valid email!`
        },
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

export default mongoose.model('Client', clientSchema);