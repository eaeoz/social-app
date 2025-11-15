// Ringtone utility for incoming calls
// Plays ringtone sounds from files based on database settings

class RingtoneManager {
  private audioContext: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private isPlaying: boolean = false;
  private intervalId: number | null = null;
  private ringtoneAudio: HTMLAudioElement | null = null;
  private voiceCallSound: string = 'default';
  private videoCallSound: string = 'default';
  private currentCallType: 'voice' | 'video' | null = null;

  constructor() {
    // Fetch sound settings from database
    this.fetchSoundSettings();
    // Refresh settings every 30 seconds
    setInterval(() => this.fetchSoundSettings(), 30000);
  }

  // Fetch sound settings from the database
  private async fetchSoundSettings() {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/settings/site`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          if (data.settings.voiceCallSound) {
            this.voiceCallSound = data.settings.voiceCallSound;
            console.log('📞 Loaded voice call sound setting:', this.voiceCallSound);
          }
          if (data.settings.videoCallSound) {
            this.videoCallSound = data.settings.videoCallSound;
            console.log('🎥 Loaded video call sound setting:', this.videoCallSound);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch sound settings:', error);
    }
  }

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

  // Get the appropriate ringtone file based on call type
  private getRingtonePath(callType: 'voice' | 'video'): string {
    const soundName = callType === 'voice' ? this.voiceCallSound : this.videoCallSound;
    return `/sounds/ringtones/${soundName}.mp3`;
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

  // Start playing the ringtone (accepts call type: 'voice' or 'video')
  startRingtone(callType: 'voice' | 'video' = 'voice') {
    if (this.isPlaying) return;

    this.initAudioContext();
    
    // Resume audio context if it's suspended (browser autoplay policy)
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;
    this.currentCallType = callType;

    // Try to play audio file first, fallback to melody if it fails
    try {
      const ringtonePath = this.getRingtonePath(callType);
      this.ringtoneAudio = new Audio(ringtonePath);
      this.ringtoneAudio.loop = true;
      this.ringtoneAudio.volume = 0.6;
      
      this.ringtoneAudio.play().then(() => {
        console.log(`🔔 ${callType === 'voice' ? '📞' : '🎥'} Ringtone started (${this.currentCallType === 'voice' ? this.voiceCallSound : this.videoCallSound})`);
      }).catch((error: any) => {
        console.warn('Failed to play ringtone file, using fallback melody:', error);
        // Fallback to generated melody
        this.playMelody();
        this.intervalId = window.setInterval(() => {
          if (this.isPlaying) {
            this.playMelody();
          }
        }, 2500);
      });
    } catch (error) {
      console.warn('Error loading ringtone, using fallback melody:', error);
      // Fallback to generated melody
      this.playMelody();
      this.intervalId = window.setInterval(() => {
        if (this.isPlaying) {
          this.playMelody();
        }
      }, 2500);
    }
  }

  // Stop the ringtone
  stopRingtone() {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    // Stop audio file if playing
    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
      this.ringtoneAudio.currentTime = 0;
      this.ringtoneAudio = null;
    }

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

    this.currentCallType = null;

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
