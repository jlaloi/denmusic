const defaultUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${
  location.hostname
}${location.port ? ":" + location.port : ""}/ws`;
const originalTitle = document.title;

let audioPlayer, socket, youTubePlayer;

const log = (msg, type = "RECEIVED") => {
  const textarea = document.getElementById("logs");
  textarea.textContent += `${new Date().toLocaleTimeString()} - ${type} : ${msg}\n`;
  textarea.scrollTop = textarea.scrollHeight;
};
const onUserAction = () => (document.getElementById("player").style.border = 0); // autoplay will work

const isMusic = (m) => m?.toLowerCase().endsWith(".mp3");

/*
 * Websocket
 */
const wsConnect = (url = defaultUrl) => {
  socket = new WebSocket(url);
  socket.onopen = () => {
    log("WS CONNECTED", "INFO");
    socket.send(`New client!`);
  };
  socket.onmessage = ({ data: msg }) => {
    log(msg);
    const videoId = getYouTubeVideoId(msg);
    if (videoId) {
      audioPlayer.pause();
      youTubePlayer.loadVideoById(videoId);
    } else if (isMusic(msg)) {
      audioPlayer.src = msg;
      document.title = msg;
      if (youTubePlayer?.stopVideo) youTubePlayer.stopVideo();
      audioPlayer.play();
    }
  };
  socket.onclose = ({ code }) => wsReconnectOnError(`WS CLOSED : ${code}`);
  socket.onerror = () => wsReconnectOnError("error");
};
let errorTimeout;
const wsReconnectOnError = (error, delay = 5000) => {
  log(`${error}\nAttempting to reconnect in ${delay / 1000}s...`, "ERROR");
  if (errorTimeout) clearTimeout(errorTimeout); // Cancel previous
  errorTimeout = setTimeout(wsConnect, delay);
};
const send = (event) => {
  event.preventDefault();
  const input = document.getElementById("msg");
  socket.send(input.value.trim());
  log(input.value, "SENT");
  input.value = "";
  onUserAction();
};

/*
 * Youtube
 */
const initYt = () => {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
};
const getYouTubeVideoId = (url) => {
  const regex = /(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/;
  if (!regex.test(url)) return null;
  const parsed = url.split(regex);
  return parsed[2] !== undefined
    ? parsed[2].split(/[^0-9a-z_\-]/i)[0]
    : parsed[0];
};
function onYouTubeIframeAPIReady() {
  youTubePlayer = new YT.Player("player", {
    height: "360",
    width: "640",
    videoId: "eePl-I8heFc",
    events: {
      onStateChange: ({ data, target }) => {
        if (data === YT.PlayerState.PLAYING) {
          const videoTitle = target?.getVideoData()?.title;
          document.title = videoTitle || originalTitle;
          onUserAction();
        } else if (data === YT.PlayerState.ENDED) target.playVideo(); // Dirty loop...
      },
    },
  });
}

/*
 * Clipboard
 */
const addVideoLinks = (links) =>
  links.forEach(({ text, value }) => {
    const a = document.createElement("a");
    a.appendChild(document.createTextNode(text));
    a.title = getYouTubeVideoId(value) || value;
    a.href = "#";
    a.onclick = () => {
      socket.send(value);
      log(value, `SENT ${text}`);
    };
    document.body.appendChild(a);
  });
const handleClipboardText = (item) => {
  const parsed = item
    .replace(/(\r|\n|\t|  )/gm, " ")
    .replace(/(  )/gm, " ")
    .split(" ")
    .reduce(
      ({ last, result }, value) => {
        if (getYouTubeVideoId(value) || isMusic(value)) {
          result.push({
            text: last,
            value,
          });
          return {
            last: "",
            result,
          };
        } else
          return {
            last: `${last} ${value}`.trim(),
            result,
          };
      },
      {
        last: "",
        result: [],
      }
    );
  if (parsed.result.length > 1) addVideoLinks(parsed.result);
};
const handleClipboard = (event) => {
  if (event.clipboardData == false || !event.clipboardData.items) return;
  Array.from(event.clipboardData.items)
    .filter(({ type }) => type === "text/html" || type === "text/plain")
    .forEach((item) => item.getAsString(handleClipboardText));
};

/**
 * Global init
 */
const init = () => {
  initYt();
  audioPlayer = document.getElementsByTagName("audio")[0];
  wsConnect();
  window.addEventListener("paste", handleClipboard, false);
  document.getElementById("msg").focus();
};
