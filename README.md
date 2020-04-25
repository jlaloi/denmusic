![](https://raw.githubusercontent.com/jlaloi/denmusic/master/public/favicon.png)

# Denmusic

Synchronize video between clients

## Running with [Deno](https://deno.land)

1. Start service:

   ```
   deno run --importmap=import_map.json --allow-net --allow-read --allow-write index.ts
   ```

   or

   ```
   yarn start
   ```

2. Expose with [ngrok](https://ngrok.com/):

   ```
   ngrok http -host-header=rewrite 9090
   ```

   or

   ```
   yarn expose
   ```

## Play video

Type: `!yt <videoId>`

## Dev

1.  VSCode extension [axetroy.vscode-deno](https://marketplace.visualstudio.com/items?itemName=axetroy.vscode-deno)

2.  Watch with [denon](https://deno.land/x/denon/):

    ```
    denon --importmap=import_map.json --allow-net --allow-read --allow-write --allow-run --fullscreen --extensions .ts index.ts
    ```

    or

    ```
    yarn watch
    ```
