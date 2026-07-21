  private processEvent(event: { time: number; type: string; track: TrackType; velocity: number }, time: number) {
    console.log(`Triggering ${event.track} at ${time}`);
    // Handle specific track triggering
    if (event.track === 'channel1') this.kickSynth.triggerAttackRelease('C1', '8n', time, event.velocity);
    // ... extend for other channels/instruments
  }
