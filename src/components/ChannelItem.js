import React,  { Component } from 'react';

const ChannelItem = ({channels, manageStream}) => {
    const listChannels = channels.map((channel)=>
        <a className="list__channel"
           key={channel.id}
           onClick={()=> manageStream(channel.id)}>
        <img className="channel-img" src={channel.icon_v2_url} alt=""/>
        <p>{channel.name}</p>
    </a>);
    return (
        <div className="list">
            {listChannels}
        </div>
    );
};

export default ChannelItem;