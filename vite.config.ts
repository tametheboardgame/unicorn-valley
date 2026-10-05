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
              name: 'diagnostic-scenes',
              test: /src[\\/]game[\\/]scenes[\\/](?:ResizeTestScene|MovementTestScene|DialogueTestScene)\.ts$/,
              priority: 15,
            },
            {
              name: 'startup-small-shared',
              test: /src[\\/]game[\\/](?:scenes[\\/]SceneKeys|world[\\/]WorldDepth|input[\\/](?:ExplorationGallop|PointerTouchInputAdapter)|ui[\\/](?:UiPrimitives|TransientFeedbackCoordinator)|save[\\/]saveLocationCheckpoint|interaction[\\/](?:InteractionModalState|InteractionTargeting)|accessibility[\\/]AccessibilitySettings|discovery[\\/]DiscoveryService|inventory[\\/]InventoryService|relationships[\\/]RelationshipService)\.ts$/,
              priority: 12,
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
