# fastidious-envelope-generator

**WARNING: Fastidious-envelope-generator is not yet ready for public consumption, the API is still a-changin'.**

## Overview

**Fastidious-envelope-generator** is an envelope generator (aka ADSR) for the Web Audio API that aims to be free of artifacts and handle edge cases well.

*TODO: demo link*

## Background

Have you heard about the [Web Audio API](https://webaudio.github.io/web-audio-api/)? It's this fantastic new API that lets you do sophisticated audio processing in the browser. One particularly important building block for audio synthesis is called an *envelope generator*, and the API helpfully includes "automation" methods (`AudioParam.linearRampToValueAtTime()`, etc.) to make it easy to build those.

And if you build an *envelope generator* using those handy methods, it will sound good, being free of any weird pops or other sonic artifacts. ... Right?

**Sadly, no**. It turns out that it is rather tricky to build a well-behaved envelope generator given the API at the time of this writing (January 2017). There are several other envelope generators on GitHub, but as far as I know they all have the issue that if a new envelope (gate-on) is started when a previous one is still playing, there will be a discontinuity that may result in a very audible click. (*please hit me up if you know of any that avoid this issue!*)

The authors of the API seem to be aware of this problem, and have spec'd an important new method called `cancelAndHoldAtTime` that will improve the situation, but that method is not yet implemented by any browsers. And even with that method, naively-coded envelope generators will still sound slightly off compared to those in most synthesizers, for reasons I will outline in more detail below.

So long story short, I really wanted a Web Audio envelope generator that worked correctly and handled all the various edge cases and so I tried to make one and it was not fun to make but I did it anyways and without further ado I humbly present to you (*snare rush, please*): **Fastidious Envelope Generator**.
