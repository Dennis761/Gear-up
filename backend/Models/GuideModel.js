import mongoose from 'mongoose';

const guideSchema = new mongoose.Schema({
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
    experience: {
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
    contact: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\+380\d{9}$/.test(v); // проверка формата номера телефона
            },
            message: props => `${props.value} is not a valid contact number!`
        },
    },
}, {
    timestamps: true,
});

export default mongoose.model('Guide', guideSchema);
