export const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => { next(error) })

        //instead of catch we can use reject()
        // call next for not stop next statement 
    }
}





/* second way for asyncHandler
const  asyncHandler=(fn)=>async(req,res,next)=>{
    try{
        await fn(req,res,next)
    }
    catch(error){
        res.status(error.code||500).json({
            success:false,
            message:error.message
        })
    }
}
    */