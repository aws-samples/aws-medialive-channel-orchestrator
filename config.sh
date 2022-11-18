#!/bin/bash

set -e
set -o pipefail

function usage {
  echo "usage: source config.sh <env name> <output_file>"
}

function main {
  if [ -z "$1" ]; then
    stack_filter="medialive-channel-orchestrator"
  else
    stack_filter="$1"
  fi

  if [ -z "$2" ]; then
    output_file=".env.local"
  else
    output_file="$2"
  fi

  echo "Retrieving stack info for ${stack_filter}"
  stack_info=$(aws cloudformation describe-stacks --stack-name "${stack_filter}" --output json)
  if [[ "$stack_info" =~ "OutputKey" ]]; then
    read -r -a output_keys <<< $(echo "$stack_info" | jq ".Stacks[].Outputs[].OutputKey")
    read -r -a output_vals <<< $(echo "$stack_info" | jq ".Stacks[].Outputs[].OutputValue")
    echo "Creating new ${output_file} file"
    cp .env.template "${output_file}"
    for ((i=0;i<${#output_keys[@]};++i)); do
      key=$(echo "${output_keys[i]}" | sed -e 's/^"//'  -e 's/"$//')
      val=$(echo "${output_vals[i]}" | sed -e 's/^"//'  -e 's/"$//')
      sed -i.bak "s,<${key}>,${val}," "${output_file}"
      rm "${output_file}".bak
    done
    echo "Done!"
  fi
}

main "$@"
