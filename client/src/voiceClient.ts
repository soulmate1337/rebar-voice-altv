import { VoiceSystemEvents } from '../../shared/events.js';
import * as alt from 'alt-client';
import * as game from 'natives';

let localPlayer: alt.Player;
let currentRange: number;
let showRangeTimer: number;
let talkingState: boolean;
let everyTickHandler: number | null = null;
let interval: number | null = null;

export function useVoiceClient() {
    localPlayer = alt.Player.local;
    talkingState = false;
    currentRange = 0;
    showRangeTimer = null;
    registerEvents();

    function registerEvents() {
        alt.on('keydown', (key) => {
            if (key === 220) {
                // ^ - Taste
                alt.emitServer(VoiceSystemEvents.ToServer.ChangeVoiceRange);
            }
        });

        alt.onServer(VoiceSystemEvents.ToClient.UpdateVoiceRange, (range) => {
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
                alt.clearInterval(interval);
            } else {
                drawVoiceRange(range);
            }
        }, 0);
    }

    function drawVoiceRange(range) {
        if (range > 0) {
            const { x, y, z } = localPlayer.pos;
            game.drawMarker(
                1,
                x,
                y,
                z - 0.8,
                0,
                0,
                0,
                0,
                0,
                0,
                range * 2,
                range * 2,
                1,
                96,
                165,
                250,
                100,
                false,
                true,
                2,
                false,
                null,
                null,
                false,
            );
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

    function onGameEntityCreate(entity: alt.Entity) {
        if (!(entity instanceof alt.Player)) return;
        updateEveryTickHandler();
    }

    function onGameEntityDestroy(entity: alt.Entity) {
        if (!(entity instanceof alt.Player)) return;
        updateEveryTickHandler();
    }

    function updateEveryTickHandler() {
        if (alt.Player.streamedIn.length > 0 && !everyTickHandler) {
            everyTickHandler = alt.everyTick(processPlayerFilters);
        } else if (alt.Player.streamedIn.length === 0 && everyTickHandler) {
            alt.clearEveryTick(everyTickHandler);
            everyTickHandler = null;
        }
    }

    function processPlayerFilters() {
        alt.Player.streamedIn.forEach((entity) => {
            const localPlayerRoomKey = game.getRoomKeyFromEntity(alt.Player.local.scriptID);
            const streamedPlayerRoomKey = game.getRoomKeyFromEntity(entity.scriptID);

            if (localPlayerRoomKey !== streamedPlayerRoomKey) {
                entity.filter = muffleFilter;
                return;
            }
            entity.filter = null;
        });
    }

    return {
        onGameEntityCreate,
        onGameEntityDestroy,
    };
}

const voiceClient = useVoiceClient();

const muffleFilter = new alt.AudioFilter('muffleFilter');
muffleFilter.addBqfEffect(0, 1000, -6, 1, 0, 0, 1);
muffleFilter.addBqfEffect(2, 100, 6, 1, 0, 0, 2);
muffleFilter.addDistortionEffect(0.2, -0.8, -0.2, 0, 0.7, 3);
muffleFilter.addVolumeEffect(0.6, 4);

alt.on('gameEntityCreate', voiceClient.onGameEntityCreate);
alt.on('gameEntityDestroy', voiceClient.onGameEntityDestroy);
