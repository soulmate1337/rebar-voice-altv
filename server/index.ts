import { useVoiceServer } from "./src/voiceServer.js";
import * as alt from 'alt-server';

const PLUGIN_NAME = 'Rebar-Voice-AltV';

useVoiceServer();
alt.log(`${PLUGIN_NAME} loaded!`)