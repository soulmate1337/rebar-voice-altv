import { VoiceSystemEvents } from '../../shared/events.js';
import * as alt from 'alt-server';

let longRangeChannel: alt.VoiceChannel;
let midRangeChannel: alt.VoiceChannel;
let lowRangeChannel: alt.VoiceChannel;

export function useVoiceServer() {
    longRangeChannel = new alt.VoiceChannel(true, 16);
    midRangeChannel = new alt.VoiceChannel(true, 8);
    lowRangeChannel = new alt.VoiceChannel(true, 2);
    registerEvents();

    function registerEvents() {
        alt.on('playerConnect', (player) => {
            player.setStreamSyncedMeta('voiceRange', 2);
            addToVoiceChannels(player);
            changeVoiceRange(player);
        });

        alt.on('playerDisconnect', removePlayerFromChannels);
        alt.onClient(VoiceSystemEvents.ToServer.ChangeVoiceRange, changeVoiceRange);
    }

    function removePlayerFromChannels(player: alt.Player) {
        if (lowRangeChannel.isPlayerInChannel(player)) lowRangeChannel.removePlayer(player);
        if (midRangeChannel.isPlayerInChannel(player)) midRangeChannel.removePlayer(player);
        if (longRangeChannel.isPlayerInChannel(player)) longRangeChannel.removePlayer(player);
    }

    function addToVoiceChannels(player: alt.Player) {
        lowRangeChannel.addPlayer(player);
        midRangeChannel.addPlayer(player);
        longRangeChannel.addPlayer(player);
    }

    function muteInAllChannels(player: alt.Player) {
        lowRangeChannel.mutePlayer(player);
        midRangeChannel.mutePlayer(player);
        longRangeChannel.mutePlayer(player);
    }

    function muteNotInRangeChannels(player: alt.Player, range: number) {
        switch (range) {
            case 1:
                midRangeChannel.mutePlayer(player);
                longRangeChannel.mutePlayer(player);
                break;
            case 8:
                lowRangeChannel.mutePlayer(player);
                longRangeChannel.mutePlayer(player);
                break;
            case 15:
                lowRangeChannel.mutePlayer(player);
                midRangeChannel.mutePlayer(player);
                break;
            default:
                break;
        }
    }

    function changeVoiceRange(player: alt.Player) {
        if(player == null) return;

        const playerVoiceRange: number = <number>player.getStreamSyncedMeta('voiceRange');
        playerVoiceRange != null ? playerVoiceRange : 0;

        const nextRanges = { 0: 2, 2: 8, 8: 15, 15: 0 };
        const newRange = nextRanges[playerVoiceRange];
        muteNotInRangeChannels(player, newRange);

        if (newRange === 0) muteInAllChannels(player);
        if (newRange === 2) lowRangeChannel.unmutePlayer(player);
        if (newRange === 8) midRangeChannel.unmutePlayer(player);
        if (newRange === 15) longRangeChannel.unmutePlayer(player);
        
        player.setStreamSyncedMeta('voiceRange', newRange);
        alt.emitClient(player, VoiceSystemEvents.ToClient.UpdateVoiceRange, newRange);
    }
}
