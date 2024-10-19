// routes/index.js
import authRoutes from './AuthRoutes.js';
import userRoutes from './UserRoutes.js';
import equipmentRoutes from './EquipmentRoutes.js';
import guideRoutes from './GuideRoutes.js';
import clientRoutes from './ClientRoutes.js';
import blogRoutes from './BlogRoutes.js';
import historyRoutes from './HistoryRoutes.js';
// import ratingRoutes from './RatingRoutes.js';
import searchRoutes from './SearchRoutes.js';
import equipmentMessageRoutes from './EquipmentMessageRoutes.js';
import guideMessageRoutes from './GuideMessageRoutes.js';
import clientMessageRoutes from './ClientMessageRoutes.js';

const configureRoutes = (app) => {
    app.use('/auth', authRoutes);
    app.use('/user', userRoutes);
    app.use('/equipment', equipmentRoutes);
    app.use('/guide', guideRoutes);
    app.use('/client', clientRoutes);
    app.use('/blogs', blogRoutes);
    app.use('/history', historyRoutes);
    // app.use('/ratings', ratingRoutes);
    app.use('/search', searchRoutes);
    app.use('/equipment/messages', equipmentMessageRoutes);
    app.use('/guide/messages', guideMessageRoutes);
    app.use('/client/messages', clientMessageRoutes);
};

export default configureRoutes;
