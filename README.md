![](https://raw.githubusercontent.com/jlaloi/denomusic/master/public/favicon.png)

# Denmusic

## Synchronize video between clients

### Running with [Deno](https://deno.land)

### Start service

```
deno run --importmap=import_map.json --allow-net --allow-read index.ts
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

### To play video

Type : `!yt <videoId>`
