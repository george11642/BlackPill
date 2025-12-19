const { withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

/**
 * Expo config plugin to add StoreKit configuration file to Xcode project
 * This ensures the Products.storekit file is included in the iOS build
 * without requiring manual Xcode configuration.
 */
const withStoreKitConfig = (config) => {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const projectPath = config.modRequest.projectName;
    
    // Path to the StoreKit file relative to the iOS project
    const storeKitFilePath = path.join(
      config.modRequest.platformProjectRoot,
      projectPath,
      'Products.storekit'
    );
    
    // Check if the file exists
    if (!fs.existsSync(storeKitFilePath)) {
      console.warn(
        `[with-storekit-config] Products.storekit not found at ${storeKitFilePath}. ` +
        `Make sure the file exists in mobile/ios/BlackPill/Products.storekit`
      );
      return config;
    }

    // Get the main target (usually the app target)
    const mainGroup = xcodeProject.getFirstProject().firstProject.mainGroup;
    const blackPillGroup = xcodeProject.findPBXGroupKey({ name: projectPath });
    
    if (!blackPillGroup) {
      console.warn(`[with-storekit-config] Could not find group for ${projectPath}`);
      return config;
    }

    // Generate a unique UUID for the file reference
    const fileRefUuid = xcodeProject.generateUuid();
    const buildFileUuid = xcodeProject.generateUuid();

    // Add file reference
    xcodeProject.addFile(
      `${projectPath}/Products.storekit`,
      blackPillGroup,
      {
        lastKnownFileType: 'wrapper.storekit',
        path: 'Products.storekit',
        sourceTree: '<group>',
      }
    );

    // Find the file reference we just added
    const fileRef = Object.keys(xcodeProject.pbxFileReferenceSection()).find(
      (key) => {
        const file = xcodeProject.pbxFileReferenceSection()[key];
        return file && file.path === 'Products.storekit';
      }
    );

    if (!fileRef) {
      console.warn('[with-storekit-config] Could not find file reference after adding');
      return config;
    }

    // Add to Resources build phase
    const resourcesBuildPhase = xcodeProject.pbxResourcesBuildPhaseObj(
      xcodeProject.getFirstTarget().uuid
    );

    if (resourcesBuildPhase) {
      // Check if already added
      const alreadyAdded = resourcesBuildPhase.files.some(
        (file) => file.fileRef === fileRef
      );

      if (!alreadyAdded) {
        resourcesBuildPhase.files.push({
          value: buildFileUuid,
          comment: 'Products.storekit in Resources',
        });

        // Add the build file entry
        xcodeProject.pbxBuildFileSection()[buildFileUuid] = {
          isa: 'PBXBuildFile',
          fileRef: fileRef,
        };
      }
    }

    console.log('[with-storekit-config] Successfully added Products.storekit to Xcode project');

    return config;
  });
};

module.exports = withStoreKitConfig;

