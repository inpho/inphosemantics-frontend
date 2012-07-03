#!/bin/bash
# fetch_and_reload.sh
#
# 2012 / 7 / 2
# Samuel Waggoner
# samuel.waggoner@gmail.com / srwaggon@indiana.edu
#
# This script is intended to be used by a crontab to
# automatically update and reload the tinytornado.py
# server used by the InPhOSemantics Frontend. 
#
#
#
# *** FRONTEND_DIR MUST BE CONFIGURED BY EACH USER  ***
#

USERNAME=`whoami`
FRONTEND_DIR="$HOME/workspace/InPhO/inphosemantics-frontend/"
FLAGS="--git-dir=$FRONTEND_DIR.git"
REMOTE="origin"
BRANCH="dev"
CMD="pull $REMOTE $BRANCH"
EXE="tinytornado.py"

echo -e "\nexecuting script as $USERNAME"

## Find old running processes and keel them.
PID=`ps -ef | grep $USERNAME | grep $EXE | grep -v grep | awk '{print $2}'`
if [ $PID ]; then
    echo -e "\nkilling process $EXE with PID $PID"
    kill $PID
fi

## Update the repository
echo -e "\nupdating repository located at $FRONTEND_DIR"
git $FLAGS $CMD

## Restart the server!
echo -e "\nStarting server using $EXE\n"
$FRONTEND_DIR$EXE
