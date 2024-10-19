import express from 'express';
import checkAuth from '../Middlewares/CheckAuth.js';
import validateBlog from '../Validation/ValidateBlog.js';
import * as blogsControllers from '../Controllers/BlogsControllers/BlogsControllers.js';

const router = express.Router();

router.post('/create', checkAuth, validateBlog, blogsControllers.createBlog);
router.put('/edit/:id', checkAuth, validateBlog, blogsControllers.editBlog);
router.get('/all', blogsControllers.getAllBlogs);
router.get('/my', checkAuth, blogsControllers.getUserBlogs);
router.delete('/:id', checkAuth, blogsControllers.deleteBlog);
router.post('/like/:blogId', checkAuth, blogsControllers.addBlogToLiked);
router.delete('/unlike/:blogId', checkAuth, blogsControllers.removeBlogFromLiked);
router.post('/save/:blogId', checkAuth, blogsControllers.addBlogToSaved);
router.delete('/unsave/:blogId', checkAuth, blogsControllers.removeBlogFromSaved);
router.get('/saved', checkAuth, blogsControllers.getSavedBlogs);

export default router;
