![](https://raw.githubusercontent.com/jlaloi/denmusic/master/public/favicon.png)

# Denmusic

Synchronize video between clients

## Running with [Deno](https://deno.land)

1. Start service:

   ```
   deno run --unstable --importmap=import_map.json --allow-net --allow-read --allow-write app/server.ts
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

Type: `any yt video link`

## Dev

1.  VSCode extension [axetroy.vscode-deno](https://marketplace.visualstudio.com/items?itemName=axetroy.vscode-deno)

2.  Watch with [denon](https://deno.land/x/denon/):

    ```
    denon
    ```

    or

    ```
    yarn start:watch
    ```
