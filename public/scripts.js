const cmdYT = '!yt ';
const defaultUrl = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.hostname}${
  location.port ? ':' + location.port : ''
}/ws`;
const originalTitle = document.title;

let youTubePlayer;
let socket;

const log = (msg, type = 'RECEIVED') => {
  const textarea = document.getElementById('logs');
  textarea.innerHTML += `${new Date().toISOString()} - ${type} : ${msg}\n`;
  textarea.scrollTop = textarea.scrollHeight;
};

/*
 * Websocket
 */
const wsConnect = (url = defaultUrl) => {
  socket = new WebSocket(url);
  socket.onopen = () => {
    log('WS CONNECTED', 'INFO');
    socket.send(`New client! Type "${cmdYT}dQw4w9WgXcQ"`);
  };
  socket.onmessage = (event) => {
    const msg = event.data;
    log(msg);
    if (msg && msg.startsWith(cmdYT)) {
      const videoId = msg.substring(cmdYT.length).trim();
      youTubePlayer.loadVideoById(videoId);
    }
  };
  socket.onclose = ({ code }) => wsReconnectOnError(`WS CLOSED : ${code}`);
  socket.onerror = () => wsReconnectOnError('error');
};
let errorTimeout;
const wsReconnectOnError = (error, delay = 5000) => {
  log(`Attempting to reconnect in ${delay / 1000}s...`, 'ERROR');
  if (errorTimeout) clearTimeout(errorTimeout); // Cancel previous
  errorTimeout = setTimeout(wsConnect, delay);
};
const send = (event) => {
  event.preventDefault();
  const input = document.getElementById('msg');
  socket.send(input.value);
  log(input.value, 'SENT');
  input.value = '';
};

/*
 * Youtube
 */
const initYt = () => {
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  const firstScriptTag = document.getElementsByTagName('script')[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};
function onYouTubeIframeAPIReady() {
  youTubePlayer = new YT.Player('player', {
    height: '360',
    width: '640',
    videoId: 'eePl-I8heFc',
    events: {
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.PLAYING) {
          const videoTitle = event.target?.getVideoData()?.title;
          if (videoTitle) document.title = `${originalTitle} - ${videoTitle}`;
          else document.title = originalTitle;
        } else if (event.data === YT.PlayerState.ENDED) event.target.playVideo(); // Dirty loop...
      },
    },
  });
}

/**
 * Global init
 */
const init = () => {
  wsConnect();
  initYt();
  document.getElementById('msg').focus();
};
