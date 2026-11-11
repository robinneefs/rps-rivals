# Focus audio and victory-title checks

AudioService now rejects effects while unfocused, hidden, locked or on a non-running WebAudio context. Existing one-shots are destroyed on blur/hidden, while music is left to Phaser's existing suspend/resume behavior. This avoids scheduling a backlog against a suspended audio clock. A regression test checks one-shot removal, music preservation and subsequent normal playback.

VictoryView gives the title a native-snapped ±2px / 2.4-second sine bob after its entrance, matching the main-menu logo. A live reduced-motion change cancels title entrance and restores its still final position. Update/listener hooks are removed on scene shutdown.

tools/art/check-focus-and-victory.mjs instruments actual AudioBufferSourceNode starts in Chrome: no starts while blurred and no burst on focus. It also verifies post-entrance victory motion and stillness after a live reduced-motion toggle. CRT noise is disabled only in the verification browser to make image comparisons deterministic. Results are in checks.json.
