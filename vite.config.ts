import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'phaser',
              test: /node_modules[\\/]phaser/,
              priority: 20,
            },
            {
              name: 'game-core-shared',
              test: /src[\\/]game[\\/](?:config[\\/]gameConstants|visual[\\/]NovaPresentation|world[\\/](?:WorldArrivalState|RainbowMeadowMap))\.ts$/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
});
