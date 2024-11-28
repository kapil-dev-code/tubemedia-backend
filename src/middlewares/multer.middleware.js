import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // cb is a callback
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) // we can remove this but we mostly use this for unique of file name in future my file is not override even we unlink our file after upload but for safety we use this
      cb(null, file.originalname + '-' + uniqueSuffix)
    }
  })
  
  export const upload = multer({ storage })