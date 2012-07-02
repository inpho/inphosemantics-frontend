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

USERNAME=`whoami`
FRONTEND_DIR="$HOME/workspace/InPhO/inphosemantics-frontend/"
FLAGS="--git-dir=$FRONTEND_DIR/.git"
REMOTE="origin"
BRANCH="dev"
CMD="pull $REMOTE $BRANCH"
EXE="tinytornado.py"

echo executing script as $USERNAME\n

## Find old running processes and keel them.
PID=`ps -ef | grep $USERNAME | grep $EXE | grep -v grep | awk '{print $2}'`
if [ $PID ]; then
    echo killing process $EXE with PID $PID\n
    kill $PID
fi

## Update the repository
echo updating repository located at $FRONTEND_DIR\n
git $FLAGS $CMD

## Restart the server!
echo Starting server using $EXE\n
$FRONTEND_DIR/bin/$EXE
