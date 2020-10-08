    // page specific set intervals
    var intervalUpdateProgram = null;

    // program function
    function renderProgram() {
        //prep the program object for use in the mustache template
        var days = conProgram.map(function(day) {
            day.tracks = day.tracks.map(function(track) {
                //make sure each track's times for chat (if available) are set to local time
                track.startDisplay = setDisplayTime(new Date(track.start));
                track.endDisplay = setDisplayTime(new Date(track.end));

                track.linkIsExternal = track.hardlink;
                track.link = track.hardLink ? track.hardLink : (track.ref + ".html")
                //handle changes for when the conference has ended
                if (conGlobal.isEnded) {
                    if (track.showOnNav.indexOf("end") < 0) {
                        track.link = "";
                    }
                }

                track.sessions.map(function(session) {
                    //make sure each session's times for chat are set to local time
                    session.startDisplay = setDisplayTime(new Date(session.start));
                    session.endDisplay = setDisplayTime(new Date(session.end));
                    
                    //handle changes for when the conference has ended - hide chat and live times
                    if (conGlobal.isEnded) {
                        session.showTimes = false;
                    }
                    return session;
                });
                return track;
            });
            day.isCurrent = conGlobal.current.day.ref === day.ref;
            return day;
        });

        // handle the page title view and template
        var viewTitle = {};
        if (conGlobal.isUnderway) {
            viewTitle.title = conGlobal.current.day.title;
            viewTitle.message = conGlobal.current.day.message;
        } else if (conGlobal.isNotStarted) {
            viewTitle.title = "Starting " + conDays[0].shortDate;
            viewTitle.message = conGlobal.conName + " runs from " + conDays[0].shortDate + " through " + conDays[conDays.length - 1].shortDate;
        } else if (conGlobal.isEnded) {
            viewTitle.conGlobal.isEnded = true;
            viewTitle.title = conGlobal.conName + " has ended";
            viewTitle.message = "";
        }
        viewTitle.timezone = getTimeZone();
        viewTitle.startingHour = setDisplayTime(new Date(conDays[0].start));
        viewTitle.isFirstDayOrEarlier = conGlobal.current.day.ref === conDays[0].ref;

        mustacheRenderFile('home-intro.mustache', viewTitle, 'app-title');
    
        // handle the program details portion of the view and template
        var viewDays = {
            days: days,
        };
        mustacheRenderFile('home-program.mustache', viewDays, 'app-program');

        // clear and reset the setinterval (if ICON not ended)
        clearInterval(intervalUpdateProgram);
        if (!conGlobal.isEnded) {
            intervalUpdateProgram = updateIfLaterThan(renderProgram, 1000 * 60 * 5, conGlobal.current.dayChange);
        }
    }

    function getTimeZone() { 
        return /\((.*)\)/.exec(new Date().toString())[1];
    }
    
    // kick off the render at the end of page load
    renderProgram();