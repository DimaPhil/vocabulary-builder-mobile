const { withDangerousMod, withXcodeProject } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const PODFILE_MARKER_START = "# >>> VocabularyBuilder deployment target override";
const PODFILE_MARKER_END = "# <<< VocabularyBuilder deployment target override";

function updateProjectBuildSettings(project, deploymentTarget, disableUserScriptSandboxing) {
  const configurations = project.pbxXCBuildConfigurationSection();

  for (const key of Object.keys(configurations)) {
    const config = configurations[key];

    if (
      typeof config !== "object" ||
      !config ||
      Array.isArray(config) ||
      !config.buildSettings
    ) {
      continue;
    }

    config.buildSettings.IPHONEOS_DEPLOYMENT_TARGET = deploymentTarget;

    if (disableUserScriptSandboxing) {
      config.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = "NO";
    }
  }

  return project;
}

function buildPodfileOverrideBlock(deploymentTarget, disableUserScriptSandboxing) {
  const overrideBlock = [
    PODFILE_MARKER_START,
    "    installer.generated_projects.each do |project|",
    "      project.build_configurations.each do |config|",
    `        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'`,
  ];

  if (disableUserScriptSandboxing) {
    overrideBlock.push(
      "        config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'"
    );
  }

  overrideBlock.push(
    "      end",
    "      project.targets.each do |target|",
    "        target.build_configurations.each do |config|",
    `          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'`
  );

  if (disableUserScriptSandboxing) {
    overrideBlock.push(
      "          config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'"
    );
  }

  overrideBlock.push(
    "        end",
    "      end",
    "      project.save",
    "    end",
    "    installer.pods_project.build_configurations.each do |config|",
    `      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'`
  );

  if (disableUserScriptSandboxing) {
    overrideBlock.push(
      "      config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'"
    );
  }

  overrideBlock.push(
    "    end",
    "    installer.pods_project.targets.each do |target|",
    "      target.build_configurations.each do |config|",
    `        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${deploymentTarget}'`
  );

  if (disableUserScriptSandboxing) {
    overrideBlock.push(
      "        config.build_settings['ENABLE_USER_SCRIPT_SANDBOXING'] = 'NO'"
    );
  }

  overrideBlock.push(
    "      end",
    "    end",
    "    installer.pods_project.save",
    PODFILE_MARKER_END
  );

  return overrideBlock.join("\n");
}

function injectPodfileOverride(contents, deploymentTarget, disableUserScriptSandboxing) {
  const overrideBlock = buildPodfileOverrideBlock(
    deploymentTarget,
    disableUserScriptSandboxing
  );
  const existingBlockPattern = new RegExp(
    `${PODFILE_MARKER_START}[\\s\\S]*?${PODFILE_MARKER_END}\\n?`,
    "g"
  );
  const cleaned = contents.replace(existingBlockPattern, "");

  const postInstallNeedle = "    )\n";
  const postInstallIndex = cleaned.indexOf(postInstallNeedle);

  if (postInstallIndex === -1) {
    throw new Error("Unable to find react_native_post_install block in Podfile.");
  }

  const insertionPoint = postInstallIndex + postInstallNeedle.length;
  return `${cleaned.slice(0, insertionPoint)}${overrideBlock}\n${cleaned.slice(
    insertionPoint
  )}`;
}

const withIosDeploymentTarget = (
  config,
  { deploymentTarget, disableUserScriptSandboxing = false }
) => {
  config = withXcodeProject(config, (config) => {
    config.modResults = updateProjectBuildSettings(
      config.modResults,
      deploymentTarget,
      disableUserScriptSandboxing
    );
    return config;
  });

  config = withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, "Podfile");
      const existingContents = fs.readFileSync(podfilePath, "utf8");
      const updatedContents = injectPodfileOverride(
        existingContents,
        deploymentTarget,
        disableUserScriptSandboxing
      );

      if (updatedContents !== existingContents) {
        fs.writeFileSync(podfilePath, updatedContents);
      }

      return config;
    },
  ]);

  return config;
};

module.exports = withIosDeploymentTarget;
