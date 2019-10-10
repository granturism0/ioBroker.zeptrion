'use strict';

const webso = require('ws');

var websockets = {}
/*
{
    id = {
        addr:'192.168.86.11',
        port:80,
        callback: callback
        ws: ws
    }
}
*/

module.exports = class Websocket{
    constructor() {}

    static add_websocket(channel_id, channel_addr, channel_port, callback, adapter){
        if(channel_id in websockets){
            Websocket.stop_websocket(channel_id, adapter)
        }
        websockets[channel_id] = {
            addr: channel_addr,
            port: channel_port,
            callback: callback,
            adapter: adapter
        }

        let ws;
        try {
            ws = new webso("ws://" + channel_addr + ':' + channel_port);
            websockets[channel_id].ws = ws;
        } catch (e) {
            adapter.log.error(e);
            setTimeout(Websocket.add_websocket(channel_id, channel_addr, channel_port, callback, adapter), 60000);
        }

        ws.on('open', function open(e) {
            console.log('open websocket: ' + this.url)
            const ip = this.url.substring(5)
            Object.keys(websockets).map(function(key, index) {
                if(websockets[key].addr + ':' + websockets[key].port === ip){
                    websockets[key].adapter.log.debug('open websocket: channel_id: ' + key + ' channel_addr: ' + websockets[key].addr + ' channel_port: ' + websockets[key].port);
                }
            });
        });
        ws.on('close', function close(e) {
            console.log('disconnected: ' + this.url);
            let err = e.code;
            const ip = this.url.substring(5)
            Object.keys(websockets).map(function(key, index) {
                if(websockets[key].addr + ':' + websockets[key].port === ip){
                    console.log('error-code: ' + err + 'reopen: channel_id: ' + key + ' channel_addr: ' + websockets[key].addr + ' channel_port: ' + websockets[key].port);
                    websockets[key].adapter.log.debug('error-code: ' + err + 'reopen: channel_id: ' + key + ' channel_addr: ' + websockets[key].addr + ' channel_port: ' + websockets[key].port);
                    websockets[key].ws.terminate();
                    //Websocket.add_websocket(key, websockets[key].addr, websockets[key].port, websockets[key].callback,adapter);
                    setTimeout( () => { Websocket.add_websocket(key, websockets[key].addr, websockets[key].port, websockets[key].callback, adapter) }, 60000);
                }
            });
        });
        ws.on('message', function incoming(data) {
            console.log('change: ' + this.url);
            const ip = this.url.substring(5)
            Object.keys(websockets).map(function(key, index) {
                if(websockets[key].addr + ':' + websockets[key].port === ip){
                    adapter.log.debug('change: channel_id: ' + key + ' channel_addr: ' + websockets[key].addr + ' channel_port: ' + websockets[key].port);
                    callback(key, data)
                }
            });
        });
        ws.on('error', function error(e) {
            let err = e.code;
            console.log('error: ' + err);
            const ip = this.url.substring(5)
            Object.keys(websockets).map(function(key, index) {
                if(websockets[key].addr + ':' + websockets[key].port === ip){
                    websockets[key].adapter.log.debug('error-code: ' + err);
                    adapter.log.debug('error-code: ' + err);
                }
            });
        });
    }

    static stop_websocket(channel_id, adapter){
        if(channel_id in websockets){
            console.log('stop_websocket: ws://' + websockets[channel_id].addr + ':' + websockets[channel_id].port);
            adapter.log.debug('stop_websocket: channel_id: ' + channel_id + ' channel_addr: ' + websockets[channel_id].addr + ' channel_port: ' + websockets[channel_id].port);
            websockets[channel_id].ws.close()
            websockets[channel_id].ws.terminate()
            delete websockets[channel_id]
        }
    }
}