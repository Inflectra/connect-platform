// set intervals
var intervalUpdateTrack = null,
    intervalUpdateTrackHeader = null;


function renderTrack(renderSpeakerInfoOnly) {
    var dateNow = new Date();

    
    // set our empty objects to get populated below
    var track = null;
    var viewHeader = {};
    var viewPlaylist = {};
    var viewSpeakers = {};
    
    //if ICON is underway set all the details required
    if (conGlobal.isUnderway) {
        //prep the track day object for use in the mustache template
        var dayArray = conProgram.filter(function(day) {
            return day.ref === conGlobal.current.day.ref;
        });
        if (dayArray.length) {
            var tracksFiltered = dayArray[0].tracks.filter(function(track) {
                return track.ref === conGlobal.current.pageRef;
            });
            track = tracksFiltered[0];
        }
        
        if (track) {
            //set the playlist view - this is v simple (just the playlist id)
            viewPlaylist.playlist = track.playlist;

            // set the header initial details
            viewHeader.subTitle = track.subTitle;
            viewHeader.feedback = track.feedback;
            viewHeader.ref = track.ref;


            // set the sessions view
            viewSpeakers.hasSessions = track.sessions && track.sessions.length > 0;

            // add discord information for tracks that show both speakers and a discord below it (useful for popular low volume tracks like keynotes)
            if (track.discordChannel) {
                viewSpeakers.discordUrl = track.discordUrl;
                viewSpeakers.discordTitle = track.discordTitle || "Community";
                viewSpeakers.titanUrl = track.titanUrl;
            }
            // sort the sessions to make sure they are in chronological order 
            viewSpeakers.sessions = track.sessions
            .sort(function(a, b) {
                return a.start < b.start ? -1 : 1;
            })
            // update the sessions times to local time
            .map(function(session) {
                session.startDisplay = setDisplayTime(new Date(session.start));
                session.endDisplay = setDisplayTime(new Date(session.end));
                return session;
            });

            
            // work out if the live session is happening now
            if (track.showSessionLiveTimes) {
                // get the current and future live sessions
                var liveSessionsLeft = viewSpeakers.sessions.filter(function(session) {
                    return dateNow.getTime() < session.end;
                });

                // if we have live chat left in the day
                if (liveSessionsLeft && liveSessionsLeft.length) {
                    var nextSession = liveSessionsLeft[0];
                    viewHeader.speakerRefs = nextSession.speakerRefs; 
                    viewHeader.showSpeakerImages = true;
                    
                    // set discord on the speaker
                    if (nextSession.discordUrl) {
                        viewHeader.discordUrl = nextSession.discordUrl;
                    }
                    
                    // if the next session hasn't started yet
                    if (dateNow.getTime() < nextSession.start) {
                        viewHeader.liveMessage = nextSession.speakerTitle + " will be live on chat " + nextSession.startDisplay + "-" + nextSession.endDisplay;

                        // set the global flag - used for the set interval function
                        conGlobal.current.liveNextChange = nextSession.start;

                    // if the next session has started it is already live
                    } else {
                        viewHeader.isLiveNow = true;
                        viewHeader.liveMessage = nextSession.speakerTitle + " (" + nextSession.startDisplay + "-" + nextSession.endDisplay + ")";
                        
                        // set the global flag - used for the set interval function
                        conGlobal.current.liveNextChange = nextSession.end;

                        // now update the speakers view list to set this session as live
                        viewSpeakers.sessions = viewSpeakers.sessions.map(function(session) {
                            // find the session that is live
                            session.isLiveNow = session.start === nextSession.start ? true : false;
                            return session;
                        })
                    }
                } else {
                    viewHeader.liveMessage = "All live speaker chats have finished for the day.";
                    // set the global flag - used for the set interval function
                    conGlobal.current.liveNextChange = false;

                    // update the speakers view list to set all sessions as no longer live
                    viewSpeakers.sessions = viewSpeakers.sessions.map(function(session) {
                        session.isLiveNow = false;
                        return session;
                    });
                }
            }
        }
    } else if (conGlobal.isNotStarted) {
        viewHeader.subTitle = "Sessions are available during " + conGlobal.conName + " (" + conDays[0].shortDate + " through " + conDays[conDays.length - 1].shortDate + ")";
        // set the global flag to the start of the conference - used for the set interval function
        conGlobal.current.liveNextChange = conGlobal.current.day.start;
    } else if (conGlobal.isEnded) {
        viewHeader.subTitle = conGlobal.conName + " has ended";
        conGlobal.isEnded = true;
    }

    /*
        ============
        RENDER LOGIC
        ============
    */
    // now that the views are all setup we can render.
    if (renderSpeakerInfoOnly) {
        // sometimes we only want to render the speaker info - eg to update live show times without disrupting the video
        mustacheRenderFile("track-intro-speakers.mustache", viewHeader, 'track-header');
        mustacheRenderFile("sidebar-speakers.mustache", viewSpeakers, 'aside-speakers');

        // clear and reset the setinterval (if ICON not ended)
        clearInterval(intervalUpdateTrackHeader);
        if (!conGlobal.isEnded) {
            intervalUpdateTrackHeader = updateIfLaterThan(renderTrackHeaderOnly, 1000 * 60 * 1, conGlobal.current.liveNextChange);
        }
    } else {
        // by default we render both parts of the track - the header and playlist
        mustacheRenderFile('track-intro-speakers.mustache', viewHeader, 'track-header');
        
        // only render the playlist and sessions if the con is underway
        if (conGlobal.isUnderway) {
            mustacheRenderFile('track-playlist.mustache', viewPlaylist, 'track-playlist'); 
            mustacheRenderFile("sidebar-speakers.mustache", viewSpeakers, 'aside-speakers');
        }
        
        // clear and reset the setinterval (if ICON not ended)
        clearInterval(intervalUpdateTrackHeader);
        clearInterval(intervalUpdateTrack);
        if (!conGlobal.isEnded) {
            intervalUpdateTrackHeader = updateIfLaterThan(renderTrackHeaderOnly, 1000 * 60 * 1, conGlobal.current.liveNextChange);
            intervalUpdateTrack = updateIfLaterThan(renderTrack, 1000 * 60 * 5, conGlobal.current.dayChange);
        }
        
    }
}

// wrapper function to call when we only want to update the header template
function renderTrackHeaderOnly() {
    renderTrack(true);
}

// render the track on first page load
renderTrack();