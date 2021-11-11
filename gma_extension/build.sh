#!/bin/bash
# vsce package;cp gma-0.0.1.vsix ../gma_tooling/extensions/
vsce package -o gma.vsix --no-yarn
code --uninstall-extension aol27cuew27wkrbzzq6djpcii6wqib6ejy3y56y2lfp2yspeiyyq.gma
code --install-extension gma.vsix

