import mongoose from 'mongoose';

// Модель пользователя
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    about: {
        type: String
    },
    phoneNumber: {
        type: String,
        required: true
    },
    region: {
        type: String,
        required: true
    },
    stars: {
        type: Number,
        default: 0
    },
    myBlogs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Blog', // Ссылка на модель Blog
    }],
    likedBlogs: [{
        type: mongoose.Schema.Types.ObjectId, // Исправлено с Array на ObjectId
        ref: 'Blog',
        default: []
    }],
    savedBlogs: [{
        type: mongoose.Schema.Types.ObjectId, // Исправлено с Array на ObjectId
        ref: 'Blog',
        default: []
    }],
    applicantsListings: {
        equipment: [{
            equipment: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Equipment'
            },
            applicants: [{
                applicant: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                message: {
                    type: String,
                    required: true
                },
                approvedState: {
                    type: Boolean,
                    default: false
                },
                startDate: {
                    type: Date,
                    default: 0
                }
            }],
        }],
        guide: [{
            guide: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Guide'
            },
            applicants: [{
                applicant: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                message: {
                    type: String,
                    required: true
                }
            }],
        }],
        client: [{
            client: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Client'
            },
            applicants: [{
                applicant: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                message: {
                    type: String,
                    required: true
                }
            }],
        }]
    },
    equipmentListings: [{
        equipment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Equipment',
        },
        user: [{
            rentedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            startDate: {
                type: Date,
            },
            endDate: {
                type: Date,
            }
        }]
    }],
    clientListings: [{
        client: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Client',
        },
        user: [{
            rentedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            startDate: {
                type: Date,
            },
            endDate: {
                type: Date,
            }
        }],
    }],
    guideListings: [{
        guide: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Guide',
        },
        user: [{
            rentedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            startDate: {
                type: Date,
            },
            endDate: {
                type: Date,
            }
        }]
    }],
    rentalHistory: [{
        rentItemName: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'type',
            required: true
        },
        type: {
            type: String,
            required: true,
            enum: ['equipment', 'client', 'guide'], // регионы как перечисление
        },
        rentedBy: {
            type: mongoose.Schema.Types.ObjectId, // Исправлено с Array на ObjectId
            ref: 'User',
            required: true
        },
        startDate: {
            type: Date,
            required: true
        },
        endDate: {
            type: Date,
            required: true
        },
        profit: {
            type: Number,
            default: 0
        }
    }],
    passwordHash: {
        type: String,
        required: true,
    },
    photo: {
        type: String,
        default: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7wrKjpbjvQzLHlQfvKO8gsopOJBvbCEXe1A&usqp=CAU'
    }
}, {
    timestamps: true // Добавляет поля createdAt и updatedAt
});

export default mongoose.model('User', UserSchema);

// import mongoose from 'mongoose';

// // Модель пользователя
// const UserSchema = new mongoose.Schema({
//     name: {
//         type: String,
//         required: true
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     about: {
//         type: String
//     },
//     phoneNumber: {
//         type: String,
//         required: true
//     },
//     region: {
//         type: String,
//         required: true
//     },
//     stars: {
//         type: Number,
//         default: 0
//     },
//     myBlogs: [{
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Blog', // Ссылка на модель Blog
//     }],
//     likedBlogs: [{
//         type: mongoose.Schema.Types.ObjectId, // Исправлено с Array на ObjectId
//         ref: 'Blog',
//         default: []
//     }],
//     savedBlogs: [{
//         type: mongoose.Schema.Types.ObjectId, // Исправлено с Array на ObjectId
//         ref: 'Blog',
//         default: []
//     }],
//     myRendedEquipment: [{
//         equipment: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Equipment',
//         },
//         rentedBy: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User',
//         }
//     }],
//     equipmentListings: [{ 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: 'Equipment' 
//     }],
//     myRendedClient: [{
//         client: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Client',
//         },
//         applicants: [{
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User',
//         }]
//     }],
//     clientListings: [{ 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: 'Client' 
//     }],
//     myRendedGuide: [{
//         guide: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Guide',
//         },
//         selectedBy: [{
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User',
//             required: true,
//         }]
//     }],
//     guideListings: [{ 
//         type: mongoose.Schema.Types.ObjectId, 
//         ref: 'Guide' 
//     }],
//     rentalHistory: [{
//         equipment: {
//             type: mongoose.Schema.Types.ObjectId, // Исправлено с Array на ObjectId
//             ref: 'Equipment',
//             required: true
//         },
//         rentedBy: {
//             type: mongoose.Schema.Types.ObjectId, // Исправлено с Array на ObjectId
//             ref: 'User',
//             required: true
//         },
//         startDate: {
//             type: Date,
//             required: true
//         },
//         endDate: {
//             type: Date,
//             required: true
//         }
//     }],
//     passwordHash: {
//         type: String,
//         required: true,
//     },
//     photo: {
//         type: String,
//         default: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ7wrKjpbjvQzLHlQfvKO8gsopOJBvbCEXe1A&usqp=CAU'
//     }
// }, {
//     timestamps: true // Добавляет поля createdAt и updatedAt
// });

// export default mongoose.model('User', UserSchema);
