import multer from "multer";

import {
    CloudinaryStorage
} from "multer-storage-cloudinary";

import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({

    cloudinary,

    params: async (req, file) => ({

        folder: "profile",

        allowed_formats: [
            "jpg",
            "jpeg",
            "png"
        ],

        resource_type: "image"

    })

});

const uploadProfile = multer({

    storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    }

});

export default uploadProfile;