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
    sportCategory: {
        type: String,
        required: true,
        enum: ['Cycling', 'Snowboarding', 'Kayaking', 'Chess', 'Rock Climbing', 'Fishing'], // категории спорта как перечисление
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