require('dotenv').config()
const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const rateLimit = require('express-rate-limit')
const app = express()
const jwt = require('jsonwebtoken')
const morgan = require('morgan') // logger
const port = 3000

app.use(require('helmet')())
app.use(morgan('dev'))

// rate limit buat endpoint public 1 menit
const globalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 20,
    message: { message: 'Too many requests, coba lagi setelah 1 menit' }
})

// rate limit buat endpoint auth 15 menit
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { message: "Too many requests, terlalu banyak request Login/Register!" }
})

app.use(globalLimiter)

const publicRoutes = [
    {method: 'POST', path: '/auth/register'},
    {method: 'POST', path: '/auth/login'},
    {method: 'POST', path: '/auth/refresh'},
    {method: 'GET', path: '/auth/github'},
    {method: 'GET', path: '/auth/github/callback'},
    {method: 'GET', path: '/events'},
]

const isPublicRoute = (req) => {
    return publicRoutes.some(route => {
        if (route.method !== req.method ) return false
        return req.path === route.path || req.path.startsWith(route.path + '/')
    })
}

// middleware buat verifikasi token
const verifyToken = (req, res, next) => {
    if (isPublicRoute(req)) return next()
    
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ') ) return res.status(401).json({ message: 'Unauthorized' })

    const token = authHeader.split(' ')[1]
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.headers['x-user-id'] = String(decoded.sub) 
        req.headers['x-user-email'] = decoded.email
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired' })
        } else {
            return res.status(401).json({ message: 'Invalid token' })
        }
    }
}

app.use(verifyToken)

// buat proxy ke masing masing service
const proxyHandler = (target) => ({
    target,
    changeOrigin: true,
    on: {
        error: (err, req, res) => {
            console.error(`Proxy error: ${err.message}`)
            res.status(502).json({ message: 'Service unavailable' })
        }
    }
})

app.use('/auth', authLimiter, createProxyMiddleware({
    ...proxyHandler('http://localhost:3001'),
    pathRewrite: { '^/auth': '' }
}))

app.use('/events', globalLimiter, createProxyMiddleware({
    ...proxyHandler('http://localhost:3002'),
    pathRewrite: { '^/events': '' }
}))

app.use('/orders', globalLimiter, createProxyMiddleware({
    ...proxyHandler('http://localhost:3003'),
    pathRewrite: { '^/orders': '' }
}))

app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.method} ${req.path} tidak ditemukan` })
})

app.listen(port, () => {
    console.log(`API Gateway berjalan pada port ${port}`)
})