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
            // These dependency-free compatibility entrypoints only re-export
            // StartupSharedRuntime. Keep their otherwise separate empty output
            // chunks together as the catalogue gains genuine new lazy scenes.
            // This retains the fixed JavaScript chunk budget without loading
            // the new Crystalarium gameplay scene before it is requested.
            {
              name: 'startup-runtime-forwarders',
              test: /src[\\/]game[\\/](?:accessibility[\\/]AccessibilitySettings|discovery[\\/]DiscoveryService|interaction[\\/](?:InteractionModalState|InteractionTargeting)|inventory[\\/]InventoryService|input[\\/]PointerTouchInputAdapter|relationships[\\/]RelationshipService|scenes[\\/]SceneKeys|ui[\\/]UiPrimitives|world[\\/]WorldDepth|save[\\/]saveLocationCheckpoint)\.ts$/,
              priority: 15,
            },
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
