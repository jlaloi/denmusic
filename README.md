![](https://raw.githubusercontent.com/jlaloi/denmusic/master/public/favicon.png)

# Denmusic

## Synchronize video between clients

### Running with [Deno](https://deno.land)

### Start service

```
deno run --importmap=import_map.json --allow-net --allow-read --allow-write index.ts
```

or

```
yarn start
```

### Expose using [ngrok](https://ngrok.com/)

```
ngrok http -host-header=rewrite 9090
```

or

```
yarn expose
```

### Watch

```
denon --importmap=import_map.json --allow-net --allow-read --allow-write --allow-run --fullscreen --extensions .ts index.ts
```

or

```
yarn watch
```

### To play video

Type : `!yt <videoId>`
