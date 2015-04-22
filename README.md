# rxlocation
GPX location library implemented with FRP concepts

Given a stream of location change events that fluctuate over time,
return a stream of instantaneous velocities, and
return another stream of zero velocity, and
return another stream of "stop" and "start" events.

