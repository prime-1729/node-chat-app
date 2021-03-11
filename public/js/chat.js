const socket = io()

// socket.on('countUpdated',(count)=>{
//     console.log('The count has been updated ',count)
// })

// document.querySelector('#increment').addEventListener('click',()=>{
//     socket.emit('increment')
// })
//Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $submitButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messagetemplate = document.querySelector('#message-template').innerHTML
const locationmessagetemplate = document.querySelector('#location-message-template').innerHTML
const sidebartemplate = document.querySelector('#sidebar-template').innerHTML

//Options
const {username , room} = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = ()=>{
    //New message element
    const $newMessage = $messages.lastElementChild

    //Height of new message
    const $newMessageStyles = getComputedStyle($newMessage)
    const $newMessageMargin = parseInt($newMessageStyles.marginBottom)
    const $newMessageHeight = $newMessage.offsetHeight + $newMessageMargin

    //Visible height
    const visibleHeight = $messages.offsetHeight

    //height of message container
    const containerMessageHeight = $messages.scrollHeight

    //how far have i scrolled
    const scrollOffSet =$messages.scrollTop + visibleHeight

    if (containerMessageHeight - $newMessageHeight<= scrollOffSet){
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message',(message)=>{
    console.log(message)
    const html = Mustache.render(messagetemplate,{
        username: message.username,
        message : message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeEnd',html)
    autoscroll()
})

socket.on('locationMessage',(url)=>{
    console.log(url)
    const html = Mustache.render(locationmessagetemplate,{
        username : url.username,
        url : url.url,
        createdAt : moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend',html)
})

socket.on('roomData',({room,users})=>{
    const html = Mustache.render(sidebartemplate,{
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

document.querySelector('#message-form').addEventListener('submit',(e)=>{
    e.preventDefault()

    $messageFormButton.setAttribute('disabled','disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage',message,(error)=>{

        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value =''
        $messageFormInput.focus()

        if (error){
           return console.log(error)
        }
        console.log('Message was delivered')
    })
})

document.querySelector('#send-location').addEventListener('click',()=>{
    if (!navigator.geolocation){
        return alert('Geolocation is not supported in your browser')
    }
    $submitButton.setAttribute('disabled','disabled')
    navigator.geolocation.getCurrentPosition((position)=>{
        const location = {
            latitude : position.coords.latitude,
            longitude : position.coords.longitude
    }
    socket.emit('sendLocation',location,()=>{
        $submitButton.removeAttribute('disabled')
        console.log('Location was shared')
    })
})
})

socket.emit('join',{username ,room},(error)=>{
    if (error){
        alert(error)
        location.href ='/'
    }
})