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
        equipmentStars: {
            type: Number,
            default: 0
        },
        guideStars: {
            type: Number,
            default: 0
        },
        clientStars: {
            type: Number,
            default: 0
        },
        averageUserRating: {
            type: Number,
            default: 0
        }
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
                status: { 
                    type: String, 
                    enum: ['pending', 'approved', 'rented', 'finished'], 
                    default: 'pending' 
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
                },
                status: { 
                    type: String, 
                    enum: ['pending', 'approved', 'rented', 'finished'], 
                    default: 'pending' 
                },
                startDate: {
                    type: Date,
                    default: 0
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
                },
                status: { 
                    type: String, 
                    enum: ['pending', 'approved', 'rented', 'finished'], 
                    default: 'pending' 
                },
                startDate: {
                    type: Date,
                    default: 0
                }
            }],
        }]
    },
    ratedRents:{
        ratedEquipment: [{
            raterId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            ratedEquipmentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Equipment',
                required: true
            },
            stars: {
                type: Number,
                max: 5,
                default: 0
            }
        }],
        ratedGuide: [{
            raterId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            ratedGuideId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Guide',
                required: true
            },
            stars: {
                type: Number,
                max: 5,
                default: 0
            }
        }],
        ratedClient: [{
            raterId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            ratedClientId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Client',
                required: true
            },
            stars: {
                type: Number,
                max: 5,
                default: 0
            }
        }]
    },
    unreadRentalRatingRequests: [{
        raterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        ratedId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'ratedModel',
            required: true
        },
        ratedModel: {
            type: String,
            enum: ['Equipment', 'Guide', 'Client'],
            required: true
        }
    }],
    rentalHistory: [{
        rentItemName: {
            // type: mongoose.Schema.Types.ObjectId,
            type: String,
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
//         equipmentStars: {
//             type: Number,
//             default: 0
//         },
//         guideStars: {
//             type: Number,
//             default: 0
//         },
//         clientStars: {
//             type: Number,
//             default: 0
//         },
//         averageUserRating: {
//             type: Number,
//             default: 0
//         }
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
//     applicantsListings: {
//         equipment: [{
//             equipment: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: 'Equipment'
//             },
//             applicants: [{
//                 applicant: {
//                     type: mongoose.Schema.Types.ObjectId,
//                     ref: 'User'
//                 },
//                 message: {
//                     type: String,
//                     required: true
//                 },
//                 approvedState: {
//                     type: Boolean,
//                     default: false
//                 },
//                 startDate: {
//                     type: Date,
//                     default: 0
//                 }
//             }],
//         }],
//         guide: [{
//             guide: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: 'Guide'
//             },
//             applicants: [{
//                 applicant: {
//                     type: mongoose.Schema.Types.ObjectId,
//                     ref: 'User'
//                 },
//                 message: {
//                     type: String,
//                     required: true
//                 }
//             }],
//         }],
//         client: [{
//             client: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: 'Client'
//             },
//             applicants: [{
//                 applicant: {
//                     type: mongoose.Schema.Types.ObjectId,
//                     ref: 'User'
//                 },
//                 message: {
//                     type: String,
//                     required: true
//                 }
//             }],
//         }]
//     },
//     equipmentListings: [{
//         equipment: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Equipment',
//         },
//         user: [{
//             rentedBy: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: 'User',
//             },
//             startDate: {
//                 type: Date,
//             },
//             endDate: {
//                 type: Date,
//             }
//         }]
//     }],
//     clientListings: [{
//         client: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Client',
//         },
//         user: [{
//             rentedBy: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: 'User',
//             },
//             startDate: {
//                 type: Date,
//             },
//             endDate: {
//                 type: Date,
//             }
//         }],
//     }],
//     guideListings: [{
//         guide: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'Guide',
//         },
//         user: [{
//             rentedBy: {
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: 'User',
//             },
//             startDate: {
//                 type: Date,
//             },
//             endDate: {
//                 type: Date,
//             }
//         }]
//     }],
//     unreadRentalRatingRequests: [{
//         raterId: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: 'User',
//             required: true
//         },
//         ratedId: {
//             type: mongoose.Schema.Types.ObjectId,
//             refPath: 'ratedModel',
//             required: true
//         },
//         ratedModel: {
//             type: String,
//             enum: ['Equipment', 'Guide', 'Client'],
//             required: true
//         }
//     }],
//     rentalHistory: [{
//         rentItemName: {
//             type: mongoose.Schema.Types.ObjectId,
//             refPath: 'type',
//             required: true
//         },
//         type: {
//             type: String,
//             required: true,
//             enum: ['equipment', 'client', 'guide'], // регионы как перечисление
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
//         },
//         profit: {
//             type: Number,
//             default: 0
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
