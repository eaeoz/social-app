// Ringtone utility for incoming calls
// Creates a soft, pleasant calling sound that's not disturbing

class RingtoneManager {
  private audioContext: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private isPlaying: boolean = false;
  private intervalId: number | null = null;

  // Initialize audio context (call this early with user interaction)
  public initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🔊 Audio context initialized');
    }
    
    // Resume audio context if suspended (mobile autoplay policy)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().then(() => {
        console.log('🔊 Audio context resumed');
      });
    }
  }

  // Create a soft, pleasant ringtone melody
  private playMelodyNote(frequency: number, duration: number, volume: number = 0.15) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Use sine wave for soft, pleasant sound
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Smooth volume envelope (attack, sustain, release)
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.1); // Soft attack
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime + duration - 0.1);
    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration); // Soft release

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);

    this.oscillators.push(oscillator);

    // Clean up after note finishes
    setTimeout(() => {
      const index = this.oscillators.indexOf(oscillator);
      if (index > -1) {
        this.oscillators.splice(index, 1);
      }
    }, duration * 1000 + 100);
  }

  // Play a gentle, pleasant melody (like iPhone default ringtone)
  private playMelody() {
    if (!this.audioContext) return;

    // Soft, pleasant chord progression
    // Notes: E5, G#5, B5 (E major chord)
    const notes = [
      { freq: 659.25, delay: 0 },     // E5
      { freq: 830.61, delay: 0.15 },  // G#5
      { freq: 987.77, delay: 0.3 }    // B5
    ];

    notes.forEach(note => {
      setTimeout(() => {
        if (this.isPlaying) {
          this.playMelodyNote(note.freq, 0.8, 0.12);
        }
      }, note.delay * 1000);
    });
  }

  // Start playing the ringtone with soft, repeating melody
  startRingtone() {
    if (this.isPlaying) return;

    this.initAudioContext();
    
    // Resume audio context if it's suspended (browser autoplay policy)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;

    // Play melody immediately
    this.playMelody();

    // Repeat melody every 2.5 seconds
    this.intervalId = window.setInterval(() => {
      if (this.isPlaying) {
        this.playMelody();
      }
    }, 2500);

    console.log('🔔 Ringtone started');
  }

  // Stop the ringtone
  stopRingtone() {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    // Clear the interval
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Stop all oscillators
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    this.oscillators = [];

    console.log('🔕 Ringtone stopped');
  }

  // Check if ringtone is currently playing
  isRingtonePlaying(): boolean {
    return this.isPlaying;
  }

  // Cleanup
  cleanup() {
    this.stopRingtone();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Export singleton instance
export const ringtoneManager = new RingtoneManager();
