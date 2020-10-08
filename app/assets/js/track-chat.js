// set intervals
var intervalUpdateTrack = null,
    intervalUpdateTrackHeader = null;

function renderChat() {
    // handle IE
    if (!Array.prototype.find) {
        var rendered = Mustache.render("<h3 class='pa4 fs-150 fw-b h-100 bg-vlight-gray br3 gray lh2 mr4'>This browser does not support " + conGlobal.conName + "'s online community. Please use a more modern and safe browser.</h3>");
        document.getElementById('aside-chat').innerHTML = rendered;
    // modern browsers
    } else {
        var view = { 
            ref: conGlobal.current.pageItem ? conGlobal.current.pageItem.ref : "index",
            title: conGlobal.current.pageItem ? conGlobal.current.pageItem.title : "Welcome",
        };
        
        //add discord information
        if (conGlobal.current.pageItem && conGlobal.current.pageItem.discordUrl) {
            view.discordUrl = conGlobal.current.pageItem.discordUrl;
            view.titanUrl = conGlobal.current.pageItem.titanUrl;
        }
        mustacheRenderFile('sidebar-chat.mustache', view, 'aside-chat');
    }
}
renderChat();


function renderTrack(renderHeaderOnly) {
    var dateNow = new Date();
    
    // set our empty objects to get populated below
    var track = null;
    var viewHeader = {};
    var viewPlaylist = {};
    
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

            // set the header details and live information
            viewHeader.subTitle = track.subTitle;
            viewHeader.feedback = track.feedback;
            viewHeader.ref = track.ref;
            viewHeader.discordUrl = conGlobal.current.pageItem.discordUrl;
            viewHeader.startDisplay = setDisplayTime(new Date(track.start));
            viewHeader.endDisplay = setDisplayTime(new Date(track.end));
            if (track.showTrackSpeakers) {
                viewHeader.hosts = track.hosts;
                viewHeader.hostRefs = track.hostRefs;
                viewHeader.showHostImages = true;
            } else {
                viewHeader.hosts = "Team Inflectra";
            }

            
            // work out if the live session is happening now
            if (track.showTrackLiveTimes) {
                if (dateNow.getTime() > track.end) {
                    viewHeader.liveMessage = viewHeader.hosts + " is no longer live on chat. Ask any questions on chat and they'll reply later."
                    // set the global flag - used for the set interval function
                    conGlobal.current.liveNextChange = false;
                } else if (dateNow.getTime() < track.start) {
                    viewHeader.liveMessage = viewHeader.hosts + " will be live on chat " + viewHeader.startDisplay + "-" + viewHeader.endDisplay;
                    
                    // set the global flag - used for the set interval function
                    conGlobal.current.liveNextChange = track.start;
                } else {
                    viewHeader.isLiveNow = true;
                    viewHeader.liveMessage = viewHeader.hosts + " (" + viewHeader.startDisplay + "-" + viewHeader.endDisplay + ")";
                    // set the global flag - used for the set interval function
                    conGlobal.current.liveNextChange = track.end;
                }
            }
        }
    } else if (conGlobal.isNotStarted) {
        viewHeader.subTitle = "Sessions are available during " + conGlobal.conName + " (" + conDays[0].shortDate + " through " + conDays[conDays.length - 1].shortDate + ")";
        // set the global flag to the start of the conference - used for the set interval function
        conGlobal.current.liveNextChange = conGlobal.current.day.start;
    } else if (conGlobal.isEnded) {
        viewHeader.subTitle = conGlobal.conName + " has ended";
    }

    /*
        ============
        RENDER LOGIC
        ============
    */
    // now that the views are all setup we can render.
    if (renderHeaderOnly) {
        // sometimes we only want to render the header - eg to update live show times without disrupting the video
        mustacheRenderFile('track-intro-single-chat.mustache', viewHeader, 'track-header');

        // clear and reset the setinterval (if ICON not ended)
        clearInterval(intervalUpdateTrackHeader);
        if (!conGlobal.isEnded) {
            intervalUpdateTrackHeader = updateIfLaterThan(renderTrackHeaderOnly, 1000 * 60 * 1, conGlobal.current.liveNextChange);
        }
    } else {
        // by default we render both parts of the track - the header and playlist
        mustacheRenderFile('track-intro-single-chat.mustache', viewHeader, 'track-header');
        
        // clear and reset the setinterval (if ICON not ended)
        clearInterval(intervalUpdateTrackHeader);
        clearInterval(intervalUpdateTrack);
        if (!conGlobal.isEnded) {
            intervalUpdateTrackHeader = updateIfLaterThan(renderTrackHeaderOnly, 1000 * 60 * 1, conGlobal.current.liveNextChange);
            intervalUpdateTrack = updateIfLaterThan(renderTrack, 1000 * 60 * 5, conGlobal.current.dayChange);
        }
        
        // only render the playlist if the con is underway
        if (conGlobal.isUnderway) {
            mustacheRenderFile('track-playlist.mustache', viewPlaylist, 'track-playlist'); 
        }
    }
}

// wrapper function to call when we only want to update the header template
function renderTrackHeaderOnly() {
    renderTrack(true);
}

// render the track on first page load
renderTrack();