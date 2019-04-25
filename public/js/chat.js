const socket = io()

// elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input[name="message"]')
const $messageFormSubmit = $messageForm.querySelector('button#submit')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoScroll = () => {
    // New message el
    const $newMessage = $messages.lastElementChild

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (msg) => {
    const html = Mustache.render(messageTemplate, {
        msg: msg.text,
        username: msg.username,
        createdAt: moment(msg.createdAt).format('h:m A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('locationMessage', (loc) => {
    const html = Mustache.render(locationTemplate, {
        url: loc.url,
        username: loc.username,
        createdAt: moment(loc.createdAt).format('h:m A')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormSubmit.setAttribute('disabled', 'disabled')

    const msg = e.target.elements.message.value

    socket.emit('sendMessage', msg, err => {
        $messageFormSubmit.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (err) {
            return console.log(err)
        }
    })
})

$locationButton.addEventListener('click', (e) => {
    if (!navigator.geolocation) {
        return alert('This browser does not support this feature.')
    }

    $locationButton.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        const coords = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
        }

        socket.emit('sendLocation', coords, () => {
            $locationButton.removeAttribute('disabled')
        })
    })
})

socket.emit('join', { username, room }, (err) => {
    if (err) {
        alert(err)
        location.href = '/'
    }
})