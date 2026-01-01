import { GLITCH_CONFIG } from "../constants";

export const useGlitchEffect = (
  duration: number
): {
  startGlitch: (
    text: string,
    callback: (glitchedText: string) => void
  ) => () => void;
} => {
  const startGlitch = (
    text: string,
    callback: (glitchedText: string) => void
  ) => {
    const textArray = text.split("");
    const textLength = textArray.filter((c) => c !== " ").length;
    const waveLength = textLength + GLITCH_CONFIG.WAVE_OFFSET;

    const totalFrames = Math.floor(duration / GLITCH_CONFIG.FRAME_TIME);
    const cyclesNeeded = Math.ceil(totalFrames / waveLength);
    const adjustedFrameTime = duration / (cyclesNeeded * waveLength);

    let frame = 0;

    const interval = setInterval(() => {
      if (frame * adjustedFrameTime >= duration) {
        callback(text);
        clearInterval(interval);
        return;
      }

      const wavePosition = frame % waveLength;

      let charIndex = 0;
      const result = textArray.map((char) => {
        if (char === " ") return " ";

        const distance = Math.abs(charIndex - wavePosition);
        charIndex++;

        if (distance < GLITCH_CONFIG.DISTANCE_THRESHOLD) {
          const random = Math.random();
          if (random > GLITCH_CONFIG.RANDOM_THRESHOLD) {
            return GLITCH_CONFIG.CHARS[
              Math.floor(Math.random() * GLITCH_CONFIG.CHARS.length)
            ];
          }
        }
        return char;
      });

      callback(result.join(""));
      frame++;
    }, adjustedFrameTime);

    return () => clearInterval(interval);
  };

  return { startGlitch };
};
