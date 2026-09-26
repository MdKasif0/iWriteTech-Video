import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

def generate_launch_soundtrack(output_path, duration=20.0, sr=48000):
    total_samples = int(duration * sr)
    t = np.linspace(0, duration, total_samples, endpoint=False)
    
    left = np.zeros(total_samples, dtype=np.float32)
    right = np.zeros(total_samples, dtype=np.float32)

    # Helper: butter lowpass
    def lowpass(data, cutoff, order=4):
        sos = butter(order, cutoff, btype='lowpass', fs=sr, output='sos')
        return sosfilt(sos, data)

    # Helper: butter bandpass
    def bandpass(data, low, high, order=3):
        sos = butter(order, [low, high], btype='bandpass', fs=sr, output='sos')
        return sosfilt(sos, data)

    # 1. Warm Synth Pad (Multi-oscillator detuned saw + sine with stereo spread)
    # Chord schedule: (start_t, end_t, frequencies)
    # Dm9 -> Fmaj7 -> Bbmaj9 -> Gm7 -> Dsus2 / D
    chords = [
        (0.0, 3.2, [146.83, 220.00, 261.63, 329.63, 349.23]),         # D3, A3, C4, E4, F4
        (3.0, 7.2, [174.61, 220.00, 261.63, 329.63, 392.00]),         # F3, A3, C4, E4, G4
        (7.0, 11.2, [116.54, 174.61, 220.00, 293.66, 349.23]),        # Bb2, F3, A3, D4, F4
        (11.0, 15.2, [98.00, 146.83, 174.61, 233.08, 293.66]),        # G2, D3, F3, Bb3, D4
        (15.0, 20.0, [73.42, 146.83, 220.00, 293.66, 369.99, 440.00]) # D2, D3, A3, D4, F#4, A4
    ]

    for start_time, end_time, freqs in chords:
        idx_start = int(start_time * sr)
        idx_end = min(total_samples, int(end_time * sr))
        chord_len = idx_end - idx_start
        t_chord = np.linspace(0, (end_time - start_time), chord_len, endpoint=False)
        
        # Envelope: soft attack, sustained, smooth release
        attack_len = int(0.5 * sr)
        release_len = int(0.6 * sr)
        env = np.ones(chord_len, dtype=np.float32)
        if chord_len > attack_len:
            env[:attack_len] = np.sin(np.linspace(0, np.pi/2, attack_len)) ** 2
        if chord_len > release_len:
            env[-release_len:] = np.cos(np.linspace(0, np.pi/2, release_len)) ** 2
            
        chord_l = np.zeros(chord_len, dtype=np.float32)
        chord_r = np.zeros(chord_len, dtype=np.float32)

        for i, f in enumerate(freqs):
            # 3 detuned voices per note
            detune = 1.0 + 0.002 * (i % 3 - 1)
            detune2 = 1.0 - 0.0025 * (i % 2)
            
            # Blend sine and soft triangle/saw
            wave_mid = np.sin(2 * np.pi * f * t_chord) * 0.5 + 0.25 * np.sin(4 * np.pi * f * t_chord)
            wave_l = np.sin(2 * np.pi * (f * detune) * t_chord) * 0.4
            wave_r = np.sin(2 * np.pi * (f * detune2) * t_chord) * 0.4
            
            chord_l += (wave_mid + wave_l) * (0.18 / len(freqs))
            chord_r += (wave_mid + wave_r) * (0.18 / len(freqs))

        # Filter warmth
        chord_l = lowpass(chord_l, 1200)
        chord_r = lowpass(chord_r, 1200)

        left[idx_start:idx_end] += chord_l * env
        right[idx_start:idx_end] += chord_r * env

    # 2. Deep Sub-bass foundation (clean pure sub-sine)
    bass_notes = [
        (0.0, 3.2, 73.42),    # D2
        (3.0, 7.2, 87.31),    # F2
        (7.0, 11.2, 58.27),   # Bb1
        (11.0, 15.2, 49.00),  # G1
        (15.0, 20.0, 73.42),  # D2
    ]
    for start_time, end_time, freq in bass_notes:
        idx_start = int(start_time * sr)
        idx_end = min(total_samples, int(end_time * sr))
        b_len = idx_end - idx_start
        t_b = np.linspace(0, (end_time - start_time), b_len, endpoint=False)
        env = np.ones(b_len, dtype=np.float32)
        att = min(int(0.3 * sr), b_len // 2)
        rel = min(int(0.5 * sr), b_len // 2)
        env[:att] = np.sin(np.linspace(0, np.pi/2, att)) ** 2
        env[-rel:] = np.cos(np.linspace(0, np.pi/2, rel)) ** 2
        sub = np.sin(2 * np.pi * freq * t_b) * 0.18 * env
        left[idx_start:idx_end] += sub
        right[idx_start:idx_end] += sub

    # 3. Soft Cinematic Whooshes on Transitions (t=2.8s, t=6.8s, t=10.8s, t=14.8s)
    transitions = [2.7, 6.7, 10.7, 14.7]
    for trans_t in transitions:
        w_dur = 1.0
        w_samples = int(w_dur * sr)
        idx_start = int(trans_t * sr)
        idx_end = min(total_samples, idx_start + w_samples)
        actual_len = idx_end - idx_start
        if actual_len <= 0:
            continue
        
        noise = np.random.randn(actual_len).astype(np.float32)
        env = np.sin(np.linspace(0, np.pi, actual_len)) ** 2
        filtered = bandpass(noise, 200, 1800) * 0.08 * env
        
        # Panning sweep left to right
        pan = np.linspace(0.2, 0.8, actual_len)
        left[idx_start:idx_end] += filtered * (1.0 - pan)
        right[idx_start:idx_end] += filtered * pan

    # 4. Tactile UI Clicks / Soft Pop Sounds
    # - t=4.5s (Stat bar reveal)
    # - t=11.6s (Split view mode toggle)
    clicks = [4.5, 11.6]
    for click_t in clicks:
        c_dur = 0.08
        c_samples = int(c_dur * sr)
        idx_start = int(click_t * sr)
        idx_end = min(total_samples, idx_start + c_samples)
        actual_len = idx_end - idx_start
        t_c = np.linspace(0, c_dur, actual_len, endpoint=False)
        # Soft woodblock / tactile mechanical switch click
        click_sound = (np.sin(2 * np.pi * 1400 * t_c) * 0.5 + np.sin(2 * np.pi * 2800 * t_c) * 0.3) * np.exp(-t_c * 90) * 0.12
        left[idx_start:idx_end] += click_sound
        right[idx_start:idx_end] += click_sound

    # 5. Master Fade-out in last 1.5 seconds
    fade_len = int(1.5 * sr)
    fade_env = np.ones(total_samples, dtype=np.float32)
    fade_env[-fade_len:] = np.cos(np.linspace(0, np.pi/2, fade_len)) ** 2
    left *= fade_env
    right *= fade_env

    # 6. Peak Normalization & Limiting to -1.5 dB (clean, no clipping)
    peak = max(np.max(np.abs(left)), np.max(np.abs(right)), 1e-6)
    target_peak = 10 ** (-1.5 / 20.0) # ~0.84
    gain = target_peak / peak
    left = np.clip(left * gain, -0.99, 0.99)
    right = np.clip(right * gain, -0.99, 0.99)

    stereo = np.column_stack((left, right))
    wavfile.write(output_path, sr, (stereo * 32767).astype(np.int16))
    print(f"Generated soundtrack saved to: {output_path}")

if __name__ == '__main__':
    generate_launch_soundtrack('/Users/mdkasifuddin/Developer/Launch Videos/iWriteTech Video/brag-output/work/soundtrack.wav')
