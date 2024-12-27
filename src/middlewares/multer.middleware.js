import multer from "multer"

const storage = multer.diskStorage({
  // in which folder we want to store our file
    destination: function (req, file, cb) {
        // cb is a callback
      cb(null, "./public/temp")
    },
    // give file name
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) // we can remove this but we mostly use this for unique  file name, in future existing file is not override even we unlink our file after upload but for safety we use this
      cb(null, file.originalname + '-' + uniqueSuffix)
    }
  })
  
  export const upload = multer({ storage })