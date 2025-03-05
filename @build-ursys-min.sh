#!/bin/sh

# build script for ur-system when the node versions are different
# in the UR directories compared to root directory.
# called from package.json scripts

# directory of this script
DIR=$(cd "$(dirname "$0")"; pwd)
DIR="$DIR/_mur/scripts"

# TERMINAL COLORS
YEL=$(tput setaf 3)
BLU=$(tput setaf 4)
BGBLU=$(tput setab 4)$(tput setaf 7)
BRI=$(tput bold)
DIM=$(tput dim)
RST=$(tput sgr0)

# print URSYS build info from git data
GIT_D=$(git log -1 --format=%cd --date=format:%Y/%m/%d)
GIT_B=$(git branch --show-current)
printf "${DIM}building URSYS-MIN Library from branch ${RST}${GIT_B}${DIM} commit date ${RST}${GIT_D}${RST}\n"

# build the minimum ursys all-in-one library
npx tsx $DIR/@build.mts 2>&1 | cat
