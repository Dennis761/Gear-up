import jwt from 'jsonwebtoken'

const userSecretCode = process.env.JWT_SECRET || 'user-secret-code'

export default (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');
    console.log('5:', token)
    if(token){
        try {
            const decoded = jwt.verify(token, userSecretCode)
            console.log(decoded)
            req.userId = decoded._id
            console.log(decoded._id)
            next()
        } catch (error) {
            res.status(400).json({
                message: 'Your access failed'
            })
        }
    } else {
        res.status(400).json({
            message: `You don't have access`
        })
    }
}
