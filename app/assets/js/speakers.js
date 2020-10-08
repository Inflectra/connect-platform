function renderSpeakers() {
    var speakersLocalTimes = conSpeakers.map(function(speaker) {
        var speakerLocal = speaker;

        // hide all times and discord if the conference has ended
        if (conGlobal.isEnded) {
            speakerLocal.discordChannel = false;
        }

        if (speaker.sessions && speaker.sessions.length) {
            speakerLocal.sessions = speaker.sessions.map(function(session) {
                // hide all times and discord if the conference has ended
                if (conGlobal.isEnded) {
                    session.showTimes = false;
                    if (session.showOnNav.indexOf("end") < 0) {
                        session.track = false;
                    }
                }

                if (session.showTimes && !session.isSummary) {
                    session.startDisplay = setDisplayTime(new Date(session.start));
                    session.endDisplay = setDisplayTime(new Date(session.end));
                }
                if (session.isSummary) {
                    session.tooltip = session.trackName.toUpperCase();
                } else {
                    session.tooltip = session.trackName.toUpperCase() + (session.description ? ": " + session.description : "");
                }
                return session;
            })
        }
        return speaker;
    })
    var viewVip = { speakers: speakersLocalTimes.filter(function(x) { return x.isVipSpeaker}) };
    var viewNonVip = { speakers: speakersLocalTimes.filter(function(x) { return !x.isVipSpeaker}) };
    mustacheRenderFile('speakers.mustache', viewVip, 'speakers-vip');
    mustacheRenderFile('speakers.mustache', viewNonVip, 'speakers-non-vip');
}
renderSpeakers();