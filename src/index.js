const express = require('express')
const app = express()
const socketio = require('socket.io')
const path = require('path')
const http =require('http')
const Filter = require('bad-words')
const { getMessage , getLocation } = require('./utils/message.js')
const {addUser, getUser, getUserInRoom, removeUser} = require('./utils/users.js')

const server = http.createServer(app)
const dirpath = path.join(__dirname,('../public'))
const io = socketio(server)
const port = process.env.PORT || 3000

app.use(express.static(dirpath))

// let count =0

io.on('connection',(socket)=>{
    console.log('New websocket connection')
    // socket.emit('countUpdated',count)

    // socket.on('increment',()=>{
    //     count++
    //     io.emit('countUpdated',count)
    // })
    socket.on('join',({username,room},callback)=>{
        const {error , user} = addUser({id: socket.id, username , room})
        if (error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message',getMessage('Admin','Welcome!'))
        socket.broadcast.to(user.room).emit('message',getMessage('Admin',`${user.username} has joined..`))
        io.to(user.room).emit('roomData',{
            room : user.room,
            users : getUserInRoom(user.room)
        })
    })

    socket.on('sendMessage',(message,callback)=>{
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }
        io.to(user.room).emit('message',getMessage(user.username,message))
        callback()
    })
    socket.on('sendLocation',(location,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',getLocation(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`))
        callback()
    })
    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if (user){
            io.to(user.room).emit('message',getMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room : user.room,
                users : getUserInRoom(user.room)
            })
        }
    })
})


server.listen(port, ()=>{
    console.log('Server is up..')
})