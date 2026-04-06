# mpv cheatsheet

## install
```
brew install mpv
```

## play
```
mpv file.webm
mpv --loop file.webm
mpv --loop --speed=0.5 file.webm
```

## keyboard
| key | action |
|-----|--------|
| space | play / pause |
| . | next frame |
| , | previous frame |
| [ | slower |
| ] | faster |
| backspace | reset speed |
| left / right | seek 5s |
| up / down | seek 60s |
| f | fullscreen |
| s | screenshot |
| q | quit |
| m | mute |
| 9 / 0 | volume down / up |
| o | show progress |
| l | set A-B loop points |

## useful flags
```
--speed=0.25          quarter speed
--start=00:00:05      start at 5s
--length=10           play only 10s
--no-audio            skip audio
--vo=null             audio only (no video window)
--screenshot-dir=./   save screenshots to current dir
--geometry=1920x1080  window size
--ontop               always on top
```
