import { VoiceSystemEvents } from '../../shared/events.js';
import * as alt from 'alt-client';
import * as game from 'natives';

let localPlayer: alt.Player;
let currentRange: number;
let showRangeTimer: number;
let talkingState: boolean;
let interval;

export function useVoiceClient() {
        localPlayer = alt.Player.local;
        talkingState = false;
        currentRange = 0;
        showRangeTimer = null;
        registerEvents();

        function registerEvents() {
        alt.on('keydown', key => {
            if (key === 220) { // ^ - Taste
                alt.emitServer(VoiceSystemEvents.ToServer.ChangeVoiceRange);
            }
        });

        alt.onServer(VoiceSystemEvents.ToClient.UpdateVoiceRange, range => {
            currentRange = range;
            showVoiceRange();
        });

        registerTalkingInterval();
    }

    function registerTalkingInterval() {
        interval = alt.setInterval(() => {
            const isTalking = localPlayer.isTalking;
            if (talkingState !== isTalking && currentRange !== 0) {
                talkingState = isTalking;
            }
        }, 444);
    }

    function showVoiceRange() {
        if (showRangeTimer) {
            clearTimeout(showRangeTimer);
            showRangeTimer = null;
        }

        const duration = 1000; // Anzeigedauer in Millisekunden
        const endTime = new Date().getTime() + duration;
        const range = getRangeDistance();

        const interval = alt.setInterval(() => {
            if (new Date().getTime() > endTime) {
                alt.clearEveryTick(interval);
            } else {
                drawVoiceRange(range);
            }
        }, 0);
    }

    function drawVoiceRange(range) {
        if (range > 0) {
            const { x, y, z } = localPlayer.pos;
            game.drawMarker(1, x, y, z - 0.8, 0, 0, 0, 0, 0, 0, range * 2, range * 2, 1, 96, 165, 250, 100, false, true, 2, false, null, null, false);
        }
    }

    function getRangeDistance() {
        switch (currentRange) {
            case 2:
                alt.Player.local.setMeta('MICROPHONE_VOLUME', 33);
                return 2; // Whisper range
            case 8:
                alt.Player.local.setMeta('MICROPHONE_VOLUME', 66);
                return 8; // Normal talking range
            case 15:
                alt.Player.local.setMeta('MICROPHONE_VOLUME', 100);
                return 15; // Shouting range
            default:
                alt.Player.local.setMeta('MICROPHONE_VOLUME', 0);
                return 0; // Kein Kreis, wenn stumm geschaltet
        }
    }
}