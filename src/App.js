import React, { useState, useEffect } from 'react';
import './App.css';
import ChannelItem from './components/ChannelItem';
import Hls from 'hls.js';

function App(){

  const [authToken, setAuthToken] = useState(null),
      /*(document.cookie.replace(/(?:(?:^|.*;\s*)authToken\s*\=\s*([^;]*).*$)|^.*$/, "$1")*/
        [channels, setListChannels] = useState([]),
        [stream, setStream] = useState(null),
        [streamId, setStreamId] = useState(null),
        [channelId, setChannelId] = useState(null),
        [updateStream, setUpdateStream] = useState(null),
        [updateStreamTimerId, setUpdateStreamTimerId] = useState(null);

  async function mainRequest(method,body){

    const tvServer = 'https://tv-server.trinity-tv.net/server/';
    const service =  'TvServerService/';
    const url = tvServer + service + method + '.json';

    console.log('req ' + method);

    try{
      const r = await fetch(url, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Accept-Encoding': 'gzip'
              },
              body:JSON.stringify(body)
          }
      );
      const data = r.json();
      console.log(data);
      return data;
    } catch(e) {
      console.log(e);
    }

  }

  useEffect(() => {
    //auth request
    const AuthRequest = {
      'device':{ 'mac' : '71:7C:ad:31:C2:67', 'type': 'DT_Web_Browser',}
    };


    mainRequest('Auth',AuthRequest)
        .then((r) => {
          if(r.status !== 'OK'){
            console.log('wrong user');
          } else {
            if(!authToken){
                setAuthToken(r.auth_token);
            }
            /*document.cookie = `authToken=${r.auth_token};expires=Fri, 31 Jun 2021 23:59:59 GMT`;*/
            console.log(authToken);
            getTvChannels();
          }
        })
        .catch((e) => {
          console.log(e);
        });

  }, [authToken]);


  //get tv channels
    function getTvChannels(){

        const channelsRequest = {
            'auth':authToken,
            'need_icons':false,
            'need_big_icons':false,
            'need_epg':false,
            'need_categories':true,
            'need_offsets':false
        }

        mainRequest('GetChannels',channelsRequest)
            .then((r) => {
                if(r.status !== 'OK') {
                    console.log('failed');
                } else {
                    setListChannels(r.list)
                    console.log(r.list)
                }
            })
            .catch((e) => {
                console.log(e);
            });
    }

    function openStream(id) {

        const openStreamReq = {
            'auth': authToken,
            'channel_id':id,
            'accept_scheme':["HTTP_HLS"],
            "epg_id": undefined,
            'multistream':true
        }

        mainRequest('OpenStream',openStreamReq)
            .then((r)=>{
                if(r.result !== 'OK'){
                    console.log('failed');
                } else {
                    setStream(`https://${r.http_stream.host.address}${r.http_stream.url}`);
                    console.log('Stream URL: ' + stream);
                    setStreamId(r.stream_id);
                    console.log('Stream id: ' + streamId);

                    setUpdateStream(r.update_interval);

                    loadVideoStream(stream);
                    updateStreamFunction(streamId);
                }
            })
            .catch((e) => {
                console.log(e)
            });
    }

    function loadVideoStream(url){

        if(Hls.isSupported()) {
            var video = document.querySelector('.video');
            video.controls = true;
            video.muted = true;
            var hls = new Hls();
            hls.loadSource(url);
            hls.on(Hls.Events.MANIFEST_PARSED,function() {
                hls.attachMedia(video);
                video.play();
            });
        } else {
            video.src = url;
            video.addEventListener('loadedmetadata',()=> {
                video.play();
            });
        }

    }

    function updateStreamFunction(idStream){

        const updateStreamBody = {
            'auth': authToken,
            'stream_id':idStream
        }

        if(!updateStreamTimerId){
            setUpdateStreamTimerId(mainRequest('UpdateStream',updateStreamBody)
                .then((r) => {
                    if(r.result === 'ReopenStream'){
                        manageStream(channelId);
                    }
                })
                .catch((e) => {
                    console.log(e)
                })
            )
        }

    }

    function manageStream(channel_id){
        if(stream){
            closeStream(streamId);
            openStream(channel_id);
        }else {
            openStream(channel_id);
        }
    }

    function closeStream(stream_id) {

        const CloseStream = {
            'auth': authToken,
            "stream_id":stream_id
        }

        console.log('Close');

        mainRequest('CloseStream',CloseStream)
            .then((r) => {
                if(r.result !== 'OK'){
                    console.log('failed close');
                } else {
                    setStream(null);
                    setUpdateStreamTimerId(null);
                }
            })
            .catch((e) => {
                console.log(e)
            });
    }

  return (

    <div className="App">
        <ChannelItem channels={channels} manageStream={manageStream}/>
        <div className='' id='video-cont'>
            <video className="video"></video>
        </div>
    </div>
  );
}

export default App;
