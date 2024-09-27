import Blog from '../Models/BlogModel.js'; // Убедитесь, что путь к модели правильный
import UserModel from '../Models/UserModel.js'; // Убедитесь, что путь к модели правильный
import { validationResult } from 'express-validator';
import { getAsync, setAsync } from '../Services/redisClient.js'; // Импорт методов Redis

export const createBlog = async (req, res) => {
    try {
        // Проверка на наличие ошибок валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        // Извлечение данных из тела запроса
        const { title, date, author, content, image } = req.body;

        // Создание нового экземпляра модели блога
        const newBlog = new Blog({
            title,
            date,
            author,
            content,
            image
        });

        // Сохранение нового блога в базе данных
        const savedBlog = await newBlog.save();

        // Отправка успешного ответа с данными сохраненного блога
        res.status(201).json({
            success: true,
            message: 'Blog created successfully',
            blog: savedBlog
        });
    } catch (error) {
        console.error(error); // Логирование ошибки для отладки
        res.status(500).json({
            success: false,
            message: 'Failed to create blog'
        });
    }
};

export const editBlog = async (req, res) => {
    try {
        // Проверка на наличие ошибок валидации
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }

        // Извлечение идентификатора блога из параметров запроса
        const blogId = req.params.id;

        // Извлечение данных для обновления из тела запроса
        const { title, date, author, content, image } = req.body;

        // Найти блог по идентификатору и обновить его данные
        const updatedBlog = await Blog.findByIdAndUpdate(
            blogId,
            {
                title,
                date,
                author,
                content,
                image
            },
            { new: true, runValidators: true }
        );

        // Проверка, найден ли блог
        if (!updatedBlog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Отправка успешного ответа с данными обновленного блога
        res.status(200).json({
            success: true,
            message: 'Blog updated successfully',
            blog: updatedBlog
        });
    } catch (error) {
        console.error(error); // Логирование ошибки для отладки
        res.status(500).json({
            success: false,
            message: 'Failed to update blog'
        });
    }
};

export const getAllBlogs = async (req, res) => {
    try {
        const cacheKey = 'all_blogs';
        
        // Попытка получить данные из кэша
        const cachedData = await getAsync(cacheKey);
        if (cachedData) {
            // Если данные есть в кэше, возвращаем их
            return res.status(200).json({
                blogs: JSON.parse(cachedData),
                message: 'List of all blogs (from cache)',
            });
        }

        // Если данных нет в кэше, выполняем запрос к базе данных
        const allBlogs = await Blog.find();

        if (allBlogs.length === 0) {
            return res.status(404).json({
                message: 'No blogs found',
            });
        }

        // Сохранение результата в кэше с истечением через 1 час (3600 секунд)
        await setAsync(cacheKey, JSON.stringify(allBlogs), 'EX', 3600);

        return res.status(200).json({
            blogs: allBlogs,
            message: 'List of all blogs',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: 'Server error',
        });
    }
};

export const getUserBlogs = async (req, res) => {
    try {
        const userId = req.userId; // Идентификатор текущего пользователя

        // Поиск пользователя и извлечение связанных блогов
        const userWithBlogs = await UserModel.findById(userId).populate('myBlogs');

        if (!userWithBlogs) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            blogs: userWithBlogs.myBlogs,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user blogs'
        });
    }
};

export const deleteBlog = async (req, res) => {
    try {
        const blogId = req.params.id; // Получаем идентификатор блога из параметров запроса

        // Поиск блога по идентификатору
        const blog = await Blog.findById(blogId);

        // Проверка, найден ли блог
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Удаление блога
        await Blog.findByIdAndDelete(blogId);

        // Обновление всех пользователей, удаление ссылок на удалённый блог из массива `myBlogs`
        await UserModel.updateMany(
            { myBlogs: blogId },
            { $pull: { myBlogs: blogId } }
        );

        // Отправка успешного ответа после удаления блога
        res.status(200).json({
            success: true,
            message: 'Blog deleted successfully'
        });
    } catch (error) {
        console.error(error); // Логирование ошибки для отладки
        res.status(500).json({
            success: false,
            message: 'Failed to delete blog'
        });
    }
};

export const addBlogToLiked = async (req, res) => {
    try {
        const userId = req.userId; // Идентификатор текущего пользователя
        const blogId = req.params.blogId; // Идентификатор блога

        // Проверка, существует ли блог
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Добавление блога в массив likedBlogs пользователя
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $addToSet: { likedBlogs: blogId } }, // Используем $addToSet чтобы избежать дублирования
            { new: true }
        );

        // Увеличение счётчика лайков в блоге
        blog.likesCount += 1;
        await blog.save();

        res.status(200).json({
            success: true,
            message: 'Blog added to liked successfully',
            likedBlogs: updatedUser.likedBlogs,
            likesCount: blog.likesCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to add blog to liked'
        });
    }
};

export const removeBlogFromLiked = async (req, res) => {
    try {
        const userId = req.userId; // Идентификатор текущего пользователя
        const blogId = req.params.blogId; // Идентификатор блога

        // Проверка, существует ли блог
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Удаление блога из массива likedBlogs пользователя
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $pull: { likedBlogs: blogId } }, // Используем $pull для удаления
            { new: true }
        );

        // Уменьшение счётчика лайков в блоге
        blog.likesCount = Math.max(blog.likesCount - 1, 0); // Защита от отрицательных значений
        await blog.save();

        res.status(200).json({
            success: true,
            message: 'Blog removed from liked successfully',
            likedBlogs: updatedUser.likedBlogs,
            likesCount: blog.likesCount
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove blog from liked'
        });
    }
};

export const addBlogToSaved = async (req, res) => {
    try {
        const userId = req.userId; // Идентификатор текущего пользователя
        const blogId = req.params.blogId; // Идентификатор блога

        // Проверка, существует ли блог
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Добавление блога в массив savedBlogs пользователя
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $addToSet: { savedBlogs: blogId } }, // Используем $addToSet чтобы избежать дублирования
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Blog added to saved successfully',
            savedBlogs: updatedUser.savedBlogs // Обновляем название на savedBlogs
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to add blog to saved'
        });
    }
};

export const removeBlogFromSaved = async (req, res) => {
    try {
        const userId = req.userId; // Идентификатор текущего пользователя
        const blogId = req.params.blogId; // Идентификатор блога

        // Проверка, существует ли блог
        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({
                success: false,
                message: 'Blog not found'
            });
        }

        // Удаление блога из массива savedBlogs пользователя
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            { $pull: { savedBlogs: blogId } }, // Используем $pull для удаления
            { new: true }
        );

        res.status(200).json({
            success: true,
            message: 'Blog removed from saved successfully',
            savedBlogs: updatedUser.savedBlogs // Обновляем название на savedBlogs
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove blog from saved'
        });
    }
};

export const getSavedBlogs = async (req, res) => {
    try {
        const userId = req.userId;
        const cacheKey = `saved_blogs_${userId}`;

        const cachedData = await getAsync(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                savedBlogs: JSON.parse(cachedData),
                message: 'Saved blogs (from cache)',
            });
        }

        const user = await UserModel.findById(userId).populate('savedBlogs');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await setAsync(cacheKey, JSON.stringify(user.savedBlogs), 'EX', 900);

        res.status(200).json({
            success: true,
            savedBlogs: user.savedBlogs
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve saved blogs'
        });
    }
};
