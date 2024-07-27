#!/bin/bash

if [ -z "$NPM_TOKEN" ]; then
  echo "Error: NPM_TOKEN environment variable is not set."
  exit 1
fi

revert_changes()
{
  echo "${original_npmrc_content}" > .npmrc
  echo "${original_package_json_content}" > package.json
}

# Get the original name from package.json
original_npmrc_content=$(cat .npmrc)
original_package_json_content=$(cat package.json)
# Update the name in package.json to match the GitHub package name
target_name="@kpkpkg/gnosis-pay-rewards-sdk" # @scope must match the repo owner on GitHub

(
  # Update the name in package.json to match the GitHub package name using jq
  jq --arg name "$target_name" '.name = $name' package.json > tmp.$$.json && mv tmp.$$.json package.json

  # configure token
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc

  # Publish the package
  npm publish --access=public --no-workspaces

  revert_changes;
) || (
  echo "Error publishing package"
  revert_changes;
)
