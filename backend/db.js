// db.js
import mongoose from 'mongoose';

const mongodb_url = process.env.MONGO_URL || 'mongodb+srv://millerden45:qetuo159@cluster0.ufrk5m5.mongodb.net/blog?retryWrites=true&w=majority'

const connectDB = async () => {
    try {
        await mongoose.connect(mongodb_url, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to the database');
    } catch (err) {
        console.error('Error connecting to the database:', err);
        process.exit(1);
    }
};

export default connectDB;
