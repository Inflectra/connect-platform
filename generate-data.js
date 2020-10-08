const yaml = require('js-yaml');
const fs   = require('fs');
const args = process.argv.slice(2);

// this function is called on running the npm command
// it takes the yaml data that is the backbone to the conference and builds out js objects that are used to populate the site itself
// we do all the crosslinking and data setting we can on the server to make the site faster client side
// param: conferenceDay - optional argument passed in at runtime, used for testing purposes to set the current day of the conference
function init (conferenceDay) {
    // get the data from YAML files
    const global = yaml.safeLoad(fs.readFileSync('src/data/global.yaml'));
    const days = yaml.safeLoad(fs.readFileSync('src/data/days.yaml'));
    const navigation = yaml.safeLoad(fs.readFileSync('src/data/navigation.yaml'));
    const sessions = yaml.safeLoad(fs.readFileSync('src/data/sessions.yaml'));
    const speakers = yaml.safeLoad(fs.readFileSync('src/data/speakers.yaml'));
    const sponsors = yaml.safeLoad(fs.readFileSync('src/data/sponsors.yaml'));

    // take all the raw data and create data ready for render
    const daysEnhanced = enhanceDays(days, global, conferenceDay);
    const navigationEnhanced = enhanceNavigation(navigation, global);
    const sessionsEnhanced = enhanceSessions(sessions, speakers, daysEnhanced, navigation, global);
    const program = generateProgram(sessionsEnhanced, speakers, daysEnhanced, navigation, global);
    const speakersEnhanced = enhanceSpeakers(sessionsEnhanced, speakers, daysEnhanced, navigation);
    const sponsorsEnhanced = enhanceSponsors(sponsors, global);

    // write out the variables to files in the app for use on the site
    // we do not use json files as that is not straightforward to read client side, so we write out the data as global variables in JS files
    fs.writeFileSync('app/assets/data/global.js', 
    `var conGlobal = ${JSON.stringify(global)}; var conDays = ${JSON.stringify(daysEnhanced)}; var conNavigation = ${JSON.stringify(navigationEnhanced)};`
    );
    fs.writeFileSync('app/assets/data/program.js', `var conProgram = ${JSON.stringify(program)}`);
    fs.writeFileSync('app/assets/data/speakers.js', `var conSpeakers = ${JSON.stringify(speakersEnhanced)}`);
    fs.writeFileSync('app/assets/data/sponsors.js', `var conSponsors = ${JSON.stringify(sponsorsEnhanced)}`);
}


// adds information to each object in the navigation array so they are more complete for rendering on the site
// param: navigation = array of nav objects (from YAML)
// param: global = global params object (from YAML)
// returns: new array of nav objects with extra information
function enhanceNavigation(navigation, global) {
    return navigation.map(nav => {
        if (nav.discordChannel) {
            // set full chat URLs so does not need to be done client side
            nav.discordUrl = "https://discord.com/channels/" + global.discordServer + "/" + nav.discordChannel;
            nav.titanUrl = "https://titanembeds.com/embed/" + global.discordServer + "?theme=DiscordDark&defaultchannel=" + nav.discordChannel;
        }
        return nav;
    })
}


// adds information to each day object in the day array so they are more complete for rendering on the site
// param: days = array of days object (from YAML)
// param: global = global params object (from YAML)
// param: conferenceDay = the day of the conference to set today to - useful for testing
// returns: new array of day objects with extra information
function enhanceDays(days, global, conferenceDay) {
    const utcOffsetMs = global.utcOffsetMinutes * 1000 * 60;
    const oneDayMs = 24 * 60 * 60 * 1000;

    let daysOffsetMs = 0;
    // if we have a passed in conferenceDay then adjust all conference days accordingly. Eg if today should be day 2, then adjust all days so when viewing the site "now" is day 2
    if (conferenceDay) {
        // work out the days between today and the conference's first day
        const now = new Date().getTime();
        const conferenceStartTime = new Date(days[0].date).getTime();
        const fromStartToToday = daysBetween(conferenceStartTime, now);
        // how many days from the start of the con to the day we want to set things to
        const daysToMove = fromStartToToday - (conferenceDay - 1);
        daysOffsetMs = daysToMove * oneDayMs;
    }

    return days.map(day => {
        day.start = new Date(day.date).getTime() - utcOffsetMs + daysOffsetMs;
        day.end = day.start + oneDayMs;
        day.shortDate = new Date(day.start).toLocaleDateString(global.locale, global.dateOptionsShort);
        day.date = new Date(day.start).toISOString().substring(0,10);
        day.message = day.message || new Date(day.start).toLocaleDateString(global.locale, global.dateOptionsLong);
        return day;
    })
}

// adds information to each session object in the sessions array so they are more complete for rendering on the site
// param: sessions = array of sessions object (from YAML)
// param: speakers = array of speakers object (from YAML)
// param: days = array of days object (from YAML)
// param: navigation = array of navigation object (from YAML)
// param: global = global params object (from YAML)
// returns: new array of session objects with extra information
function enhanceSessions(sessions, speakers, days, navigation, global) {
    // error handling for missing data
    if (arguments.length < 4 ) {
        throw new Error('required params missing');
    }

    // filter to only those sessions that have both a track and a day to filter out anything else from the program
    return sessions.filter(x => x.track && x.day).map(session => {
        
        // get matches for the session from other conference data lists
        const sessionSpeakers = speakers.filter(speaker => session.speakerRefs.includes(speaker.ref));
        const hasSpeaker = sessionSpeakers.length > 0;
        const sessionDay = days.filter(day => session.day === day.ref)[0] || null;
        const sessionTrack = navigation.filter(track => session.track === track.ref)[0] || null;

        // use day information to properly set the times
        if (sessionDay) {
            // time fields are written in yaml as "hhmm" (1430, 0945), which can either be a string or int so convert it to a string here to handle all cases
            const timeRegex = /\d{4}/g;
            const startTime = session.start && session.start.toString();
            const endTime = session.end && session.end.toString();
            if (startTime && startTime.match(timeRegex)) {
                const startHours = startTime.substring(0,2),
                    startMinutes = startTime.substring(2,4);
                session.start = new Date(sessionDay.start).setHours(startHours, startMinutes, 00)
            }
            if (endTime && endTime.match(timeRegex)) {
                const endHours = endTime.substring(0,2),
                    endMinutes = endTime.substring(3,5);
                session.end = new Date(sessionDay.start).setHours(endHours, endMinutes, 00)
            }
        }
        
        // add speaker information to the session object
        if (hasSpeaker) {
            session.speakerNames = sessionSpeakers.map(x => x.name) || null;
            session.speakerOrgs = sessionSpeakers.map(x => x.org) || null;
            if (session.speakerNames.length) {
                session.speakerTitle = session.speakerNames.join();
                if (session.speakerOrgs.length) {
                    session.speakerTitle += " (" + session.speakerOrgs.join() + ")";
                }
            }
            // we can only have one discord channel per session, so use the first in speaker in the array if we have more than one.
            session.discordUrl = sessionSpeakers[0].discordChannel ? "https://discord.com/channels/" + global.discordServer + "/" + sessionSpeakers[0].discordChannel.discordChannel : null;
        }
        
        // add track information
        if (sessionTrack) {
            session.trackIcon = sessionTrack.iconClass;
            session.showSpeaker = sessionTrack.showSessionSpeakers && hasSpeaker ? true : false;
            session.showTimes = sessionTrack.showSessionLiveTimes && session.start  ? true : false;
        } 
        
        // retun the enhanced session
        return session;
    })
}

// creates the program array which is structured as days > tracks > sessions
// param: sessions = array of sessions object (from YAML)
// param: speakers = array of speakers object (from YAML)
// param: days = array of days object (from YAML)
// param: navigation = array of navigation object (from YAML)
// param: global = global params object (from YAML)
// returns: new nested array of objects that depicts the entire program in a nice structure
function generateProgram(sessions, speakers, days, navigation, global) {
    // get just the tracks from the navigation list and sort it by its position
    const tracks = navigation.filter(nav => nav.isTrack).sort((a,b) => a.position - b.position); 

    let program = days.map(day => {
        // set the info required for each day
        let dayInfo = {
            ref: day.ref,
            title: day.title,
            message: day.message,
            shortDate: day.shortDate,
            start: day.start,
            end: day.end
        };

        // set the info for the tracks available each day    
        dayInfo.tracks = [];
        tracks.forEach(t => {   
            //make a deep copy of the track to remove side effects of updating the original object
            let track = JSON.parse(JSON.stringify(t));

            // get the sessions for this day and this track       
            let dayTrackSessions = sessions.filter(session => session.day === day.ref && session.track === track.ref);
                
            //only add the track to the day if the track has sessions
            if (dayTrackSessions.length) {
                // set the track start / end times - ie the earliest start and the latest end time of the sessions in the track
                if (track.showTrackLiveTimes) {
                    track.start = dayTrackSessions.map(x => x.start).sort()[0];
                    track.end = dayTrackSessions.map(x => x.end).sort().reverse()[0];
                }

                // set the speaker info for the track if that is required
                if (track.showTrackSpeakers) {
                    track.speakerRefs = [...new Set(dayTrackSessions.map(x => x.speakerRefs).flat())];
                    track.speakerNames = [...new Set(dayTrackSessions.map(x => x.speakerName).flat())];
                    track.speakerOrgs = [...new Set(dayTrackSessions.map(x => x.speakerOrg).flat())];
                }

                // set extra params from the track object here
                track.showTrackSpeakersOrTime = track.showTrackLiveTimes || track.showTrackSpeakers;

                //set the day info on the track itself here
                track.dayRef = day.ref;
                track.subTitle = day.titles[track.ref];
                track.playlist = day.playlists[track.ref];
                track.feedback = day.feedback[track.ref];

                // add the day track sessions to the track object - sorting the sessions first
                // sort the array by time (if we are showing times), otherwise by title (ie alphabetically)
                track.sessions = dayTrackSessions.sort((a, b) => {
                    if (track.showSessionLiveTimes) {
                        return a.start < b.start ? -1 : 1;
                    } else {
                        return a.title < b.title ? -1 : 1;
                    }
                });
                dayInfo.tracks.push(track);
            }
        });
        return dayInfo;
    });
    return program;
}

// adds information to each speaker object in the speakers array so they are more complete for rendering on the site
// param: sessions = array of sessions object (from YAML)
// param: speakers = array of speakers object (from YAML)
// param: days = array of days object (from YAML)
// param: navigation = array of navigation object (from YAML)
// returns: new array of speaker objects with extra information
function enhanceSpeakers(sessions, speakers, days, navigation) {
    return speakers.map(speaker => {
        // get the sessions for each speaker
        const speakerSessions = sessions.filter(session => session.speakerRefs.includes(speaker.ref));
        if (speakerSessions && speakerSessions.length) {
            let trackDayRefs = [];

            // map through the sessions and add some extra info to the session object
            let sessionsEnhanced = [];
            speakerSessions.forEach(session => {
                // get matches for the session from other conference data lists
                const sessionDay = days.filter(day => session.day === day.ref)[0] || null;
                const sessionTrack = navigation.filter(track => session.track === track.ref)[0] || null;

                const trackDayRef = session.day + "-" + session.track;
                let addSession = false;

                if (trackDayRefs.includes(trackDayRef)) {
                    if (sessionTrack && sessionTrack.hideSessionsForSpeaker) {
                        // do nothing
                    } else {
                        // set the flag to add this session
                        addSession = true;
                    }
                } else {
                    // if the day track has not been set yet for this speaker, add it to our list and set the flag to add this session
                    trackDayRefs.push(trackDayRef);
                    addSession = true;
                }
                
                if (addSession) {
                    session.trackDayRef = trackDayRef;

                    // add day information to the session object
                    if (sessionDay) {
                        session.dayName = sessionDay.title;
                        session.trackDayName = sessionDay.titles[session.track] || null;
                    }
    
                    // add track information to the session object
                    if (sessionTrack) {
                        session.trackName = sessionTrack.title;
                        session.showOnNav = sessionTrack.showOnNav;
                        session.hardLink = sessionTrack.hardLink || false;
                    }

                    // handle sessions in tracks where we only show the track once - not each and every session
                    if (sessionTrack.hideSessionsForSpeaker) {
                        session.title = session.trackDayName || session.trackName;
                        session.isSummary = true;
                    }

                    sessionsEnhanced.push(session);
                }
            });
            speaker.sessions = sessionsEnhanced;
        }
        return speaker;
    })
}


// adds information to each object in the sponsors array so they are more complete for rendering on the site
// param: sponsors = array of sponsor objects (from YAML)
// param: global = global params object (from YAML)
// returns: new array of sponsor objects with extra information
function enhanceSponsors(sponsors, global) {
    return sponsors.map(sponsor => {
        if (sponsor.discordChannel) {
            // set full chat URLs so does not need to be done client side
            sponsor.discordUrl = "https://discord.com/channels/" + global.discordServer + "/" + sponsor.discordChannel;
            sponsor.titanUrl = "https://titanembeds.com/embed/" + global.discordServer + "?theme=DiscordDark&defaultchannel=" + sponsor.discordChannel;
        }
        return sponsor;
    })
}


// UTILITY FUNCTION
function daysBetween(a, b) {
    const oneDayMs = 24 * 60 * 60 * 1000;

    const aDaysSinceEpoch = Math.floor(a / oneDayMs);
    const bDaysSinceEpoch = Math.floor(b / oneDayMs);

    return bDaysSinceEpoch - aDaysSinceEpoch;
}



init(args[0]);